import {
    BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { OrdersService } from '../order/orders.service';
import { assertTransition } from '../order/order-state';
import type { PaymentDto } from './payments.controller';
import { VnpayService } from './vnpay.service';

type PaymentWithOrder = Prisma.PaymentGetPayload<{ include: { order: true } }>;

@Injectable()
export class PaymentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly vnpayService: VnpayService,
        private readonly ordersService: OrdersService,
    ) {}

    private key(value: string | undefined): string {
        const key = value?.trim() || '';
        if (key.length < 8 || key.length > 128) {
            throw new BadRequestException('Idempotency-Key phải dài 8–128 ký tự');
        }
        return key;
    }

    private replayMock(payment: PaymentWithOrder, userId: string, dto: PaymentDto) {
        const status = dto.simulateFailure ? PaymentStatus.FAILED : PaymentStatus.SUCCESS;
        if (payment.orderId !== dto.orderId || payment.order.userId !== userId ||
            payment.method !== dto.method || payment.status !== status) {
            throw new ConflictException('Idempotency-Key đã sử dụng cho yêu cầu khác');
        }
        return { replay: true, order: payment.order, payment,
            earnedPoints: status === PaymentStatus.SUCCESS ? Math.floor(Number(payment.amount) / 10000) : 0 };
    }

    // Cùng một DB transaction: không có PAID nếu thiếu kho, coupon hay điểm.
    // Dùng chung cho WALLET/CARD mock và VNPay IPN.
    private async finalizePaid(tx: Prisma.TransactionClient, orderId: string): Promise<number> {
        const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
        let before = order.status;
        if (before === OrderStatus.PAYMENT_FAILED) {
            assertTransition(before, OrderStatus.PENDING);
            const retry = await tx.order.updateMany({
                where: { id: orderId, status: before }, data: { status: OrderStatus.PENDING },
            });
            if (retry.count !== 1) throw new ConflictException('Đơn vừa thay đổi');
            await tx.orderStatusHistory.create({
                data: { orderId, fromStatus: before, toStatus: OrderStatus.PENDING },
            });
            before = OrderStatus.PENDING;
        }
        assertTransition(before, OrderStatus.PAID);

        // Sửa lỗi hồi quy: trừ kho và ghi movement trước khi xác nhận thanh toán.
        await this.ordersService.consumeIngredients(tx, orderId);

        if (order.couponId) {
            const coupon = await tx.coupon.findUniqueOrThrow({ where: { id: order.couponId } });
            const now = new Date();
            const updated = await tx.coupon.updateMany({
                where: { id: coupon.id, isActive: true, usedCount: { lt: coupon.maxUses },
                    validFrom: { lte: now }, validTo: { gt: now },
                    minOrderValue: { lte: order.subtotal } },
                data: { usedCount: { increment: 1 } },
            });
            if (updated.count !== 1) throw new ConflictException('Coupon không còn hợp lệ');
            const voucher = await tx.userVoucher.findUnique({
                where: { userId_couponId: { userId: order.userId, couponId: coupon.id } },
            });
            if (voucher) {
                const consumed = await tx.userVoucher.updateMany({
                    where: { id: voucher.id, usedAt: null, usedOrderId: null },
                    data: { usedAt: now, usedOrderId: orderId },
                });
                if (consumed.count !== 1) throw new ConflictException('Voucher đã được sử dụng');
            } else {
                const privateVoucher = await tx.userVoucher.findFirst({ where: { couponId: coupon.id } });
                if (privateVoucher) throw new ForbiddenException('Voucher không thuộc tài khoản');
            }
        }

        if (order.pointsUsed > 0) {
            const spent = await tx.user.updateMany({
                where: { id: order.userId, loyaltyPoints: { gte: order.pointsUsed } },
                data: { loyaltyPoints: { decrement: order.pointsUsed } },
            });
            if (spent.count !== 1) throw new ConflictException('Không đủ điểm thưởng');
            await tx.loyaltyTransaction.create({
                data: { orderId, userId: order.userId, type: 'REDEEM', points: order.pointsUsed },
            });
        }

        const changed = await tx.order.updateMany({
            where: { id: orderId, status: OrderStatus.PENDING },
            data: { status: OrderStatus.PAID, updatedAt: new Date() },
        });
        if (changed.count !== 1) throw new ConflictException('Đơn đã được xử lý');
        await tx.orderStatusHistory.create({
            data: { orderId, fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PAID },
        });

        const earned = Math.floor(Number(order.total) / 10000);
        if (earned > 0) {
            // Điểm thưởng trước đó có thể đã bị thu hồi lúc hủy đơn khác.
            const user = await tx.user.findUniqueOrThrow({ where: { id: order.userId } });
            const payDebt = Math.min(earned, user.loyaltyDebt);
            await tx.user.update({ where: { id: order.userId }, data: {
                    loyaltyDebt: { decrement: payDebt },
                    loyaltyPoints: { increment: earned - payDebt },
                }});
            await tx.loyaltyTransaction.create({
                data: { orderId, userId: order.userId, type: 'EARN', points: earned },
            });
        }
        return earned;
    }

    // Đơn 0 đồng được xác nhận trực tiếp bằng giao dịch nội bộ, KHÔNG giả mạo VNPay.
    // Chống xử lý hai lần bằng trạng thái đơn và transaction Serializable.
    async completeZeroTotal(userId: string, orderId: string) {
        try {
            return await this.prisma.$transaction(async tx => {
                const order = await tx.order.findUnique({ where: { id: orderId } });
                if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
                if (order.userId !== userId) throw new ForbiddenException('Không thể xác nhận đơn người khác');
                if (Number(order.total) !== 0) {
                    throw new BadRequestException('Chỉ xác nhận trực tiếp đơn có tổng tiền bằng 0');
                }
                // Không tạo thành công giả nếu đơn đã có giao dịch cần đối soát.
                const existingPayment = await tx.payment.findFirst({
                    where: { orderId, status: { in: [PaymentStatus.PENDING, PaymentStatus.SUCCESS] } },
                });
                if (existingPayment) throw new ConflictException('Đơn có giao dịch thanh toán cần kiểm tra');
                if (order.status === OrderStatus.PAID) {
                    return { orderId, status: order.status, total: 0, earnedPoints: 0, replay: true };
                }
                if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAYMENT_FAILED) {
                    throw new ConflictException('Đơn không ở trạng thái chờ thanh toán');
                }
                if (order.expiresAt <= new Date()) {
                    throw new BadRequestException('Đơn đã hết thời gian thanh toán');
                }
                const earnedPoints = await this.finalizePaid(tx, orderId);
                return { orderId, status: OrderStatus.PAID, total: 0, earnedPoints, replay: false };
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (error: any) {
            if (error?.code === 'P2034' || error?.code === 'P2002') {
                throw new ConflictException('Đơn đang được xử lý, hãy xem lịch sử đơn rồi thử lại');
            }
            throw error;
        }
    }

    async pay(userId: string, rawKey: string | undefined, dto: PaymentDto) {
        // Không bao giờ cho phép thanh toán giả lập trên Render/production trừ khi bật rõ ràng.
        if (process.env.ENABLE_DEMO_PAYMENTS !== 'true') {
            throw new ForbiddenException('Thanh toán ví/thẻ mô phỏng đã tắt. Vui lòng sử dụng VNPay.');
        }
        const idempotencyKey = this.key(rawKey);
        const existing = await this.prisma.payment.findUnique({
            where: { idempotencyKey }, include: { order: true },
        });
        if (existing) return this.replayMock(existing, userId, dto);
        try {
            return await this.prisma.$transaction(async tx => {
                const replay = await tx.payment.findUnique({
                    where: { idempotencyKey }, include: { order: true },
                });
                if (replay) return this.replayMock(replay, userId, dto);
                const order = await tx.order.findUnique({ where: { id: dto.orderId } });
                if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
                if (order.userId !== userId) throw new ForbiddenException('Không thể thanh toán đơn của người khác');
                if (Number(order.total) === 0) throw new BadRequestException('Đơn 0 đồng phải dùng API xác nhận miễn phí');
                if (order.expiresAt <= new Date()) throw new BadRequestException('Đơn đã hết thời gian thanh toán');
                const pending = await tx.payment.findFirst({
                    where: { orderId: order.id, method: PaymentMethod.VNPAY,
                        status: { in: [PaymentStatus.PENDING, PaymentStatus.SUCCESS] } },
                });
                if (pending) throw new ConflictException('Đơn có giao dịch VNPay; không được thanh toán mô phỏng thêm');
                let earnedPoints = 0;
                if (!dto.simulateFailure) earnedPoints = await this.finalizePaid(tx, order.id);
                else {
                    let oldStatus = order.status;
                    if (oldStatus === OrderStatus.PAYMENT_FAILED) {
                        await tx.order.updateMany({ where: { id: order.id, status: oldStatus },
                            data: { status: OrderStatus.PENDING } });
                        await tx.orderStatusHistory.create({ data: {
                                orderId: order.id, fromStatus: oldStatus, toStatus: OrderStatus.PENDING,
                            }});
                        oldStatus = OrderStatus.PENDING;
                    }
                    assertTransition(oldStatus, OrderStatus.PAYMENT_FAILED);
                    const updated = await tx.order.updateMany({
                        where: { id: order.id, status: oldStatus },
                        data: { status: OrderStatus.PAYMENT_FAILED },
                    });
                    if (updated.count !== 1) throw new ConflictException('Đơn đã thay đổi');
                    await tx.orderStatusHistory.create({ data: {
                            orderId: order.id, fromStatus: oldStatus, toStatus: OrderStatus.PAYMENT_FAILED,
                        }});
                }
                const payment = await tx.payment.create({ data: {
                        orderId: order.id, idempotencyKey, amount: order.total, method: dto.method,
                        status: dto.simulateFailure ? PaymentStatus.FAILED : PaymentStatus.SUCCESS,
                    }});
                const savedOrder = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
                return { replay: false, order: savedOrder, payment, earnedPoints };
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (error: any) {
            if (error?.code === 'P2002' || error?.code === 'P2034') {
                const replay = await this.prisma.payment.findUnique({
                    where: { idempotencyKey }, include: { order: true },
                });
                if (replay) return this.replayMock(replay, userId, dto);
                throw new ConflictException('Thanh toán đang được xử lý, hãy kiểm tra lịch sử đơn');
            }
            throw error;
        }
    }

    private getClientIp(req: Request): string {
        // req.ip chỉ dùng X-Forwarded-For khi Express được cấu hình trust proxy đáng tin cậy.
        const ip = req.ip?.replace('::ffff:', '') || '127.0.0.1';
        return ip === '::1' ? '127.0.0.1' : ip;
    }

    private makePaymentUrl(payment: {
        providerRef: string | null; amount: Prisma.Decimal; orderId: string;
        vnpCreateDate: string | null; vnpIpAddr: string | null; order: { expiresAt: Date };
    }) {
        return this.vnpayService.createPaymentUrl({
            txnRef: payment.providerRef!, amount: Number(payment.amount),
            orderInfo: `Thanh toan don ${payment.orderId}`,
            ipAddress: payment.vnpIpAddr || '127.0.0.1',
            createDate: payment.vnpCreateDate!,
            expireDate: this.vnpayService.formatDate(payment.order.expiresAt),
        });
    }

    async createVnpay(userId: string, rawKey: string | undefined, orderId: string, req: Request) {
        const idempotencyKey = this.key(rawKey);
        this.vnpayService.assertConfigured(); // Thiếu config thì KHÔNG ghi PENDING vào DB.
        const created = await this.prisma.$transaction(async tx => {
            const replay = await tx.payment.findUnique({
                where: { idempotencyKey }, include: { order: true },
            });
            if (replay) {
                if (replay.orderId !== orderId || replay.order.userId !== userId || replay.method !== PaymentMethod.VNPAY) {
                    throw new ConflictException('Idempotency-Key đã sử dụng cho yêu cầu khác');
                }
                if (replay.status !== PaymentStatus.PENDING) {
                    throw new ConflictException('Giao dịch đã hoàn tất, hãy xem trạng thái đơn');
                }
                return replay;
            }
            const order = await tx.order.findUnique({ where: { id: orderId } });
            if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
            if (order.userId !== userId) throw new ForbiddenException('Không thể thanh toán đơn của người khác');
            if (order.expiresAt <= new Date()) throw new BadRequestException('Đơn đã hết thời gian thanh toán');
            if (!Number.isSafeInteger(Number(order.total)) || Number(order.total) <= 0) {
                throw new BadRequestException('VNPay yêu cầu số tiền thanh toán lớn hơn 0 VND');
            }
            if (
                order.status !== OrderStatus.PENDING &&
                order.status !== OrderStatus.PAYMENT_FAILED
            ) {
                throw new ConflictException('Đơn không còn chờ thanh toán');
            }
            const active = await tx.payment.findFirst({
                where: { orderId, status: PaymentStatus.PENDING, method: PaymentMethod.VNPAY },
            });
            if (active) return { ...active, order }; // Không tạo giao dịch trùng nếu trình duyệt mất key.
            const success = await tx.payment.findFirst({
                where: { orderId, status: PaymentStatus.SUCCESS },
            });
            if (success) throw new ConflictException('Đơn đã được thanh toán');
            if (order.status === OrderStatus.PAYMENT_FAILED) {
                assertTransition(order.status, OrderStatus.PENDING);
                const updated = await tx.order.updateMany({
                    where: { id: orderId, status: OrderStatus.PAYMENT_FAILED },
                    data: { status: OrderStatus.PENDING },
                });
                if (updated.count !== 1) throw new ConflictException('Đơn vừa thay đổi');
                await tx.orderStatusHistory.create({ data: {
                        orderId, fromStatus: OrderStatus.PAYMENT_FAILED, toStatus: OrderStatus.PENDING,
                    }});
            }
            const payment = await tx.payment.create({ data: {
                    orderId, idempotencyKey, amount: order.total, method: PaymentMethod.VNPAY,
                    status: PaymentStatus.PENDING, providerRef: randomUUID().replace(/-/g, ''),
                    vnpCreateDate: this.vnpayService.formatDate(new Date()),
                    vnpIpAddr: this.getClientIp(req),
                }});
            return { ...payment, order };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }).catch((error: any) => {
            if (error?.code === 'P2002' || error?.code === 'P2034') {
                throw new ConflictException('Đơn đang được thanh toán, vui lòng kiểm tra trạng thái');
            }
            throw error;
        });
        return {
            paymentId: created.id, orderId: created.orderId, amount: Number(created.amount),
            status: created.status, paymentUrl: this.makePaymentUrl(created),
        };
    }

    private ack(code: string, message: string) { return { RspCode: code, Message: message }; }

    private async finalizeConfirmedVnpay(orderId: string) {
        const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId } });
        if (![OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED].includes(order.status)) return;
        await this.prisma.$transaction(
            async tx => { await this.finalizePaid(tx, orderId); },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
    }

    // Dành cho ADMIN: nhìn thấy cả IPN mất và trường hợp ngân hàng đã thu tiền
    // nhưng hoàn tất đơn thất bại. Không bao giờ tự giải phóng giao dịch chưa xác minh.
    async getReconciliationQueue(role: string) {
        if (role !== 'ADMIN') throw new ForbiddenException('Chỉ quản trị viên được đối soát VNPay');
        const cutoff = new Date(Date.now() - 25 * 60_000);
        return this.prisma.payment.findMany({
            where: { method: PaymentMethod.VNPAY, OR: [
                { status: PaymentStatus.PENDING, createdAt: { lt: cutoff } },
                { status: PaymentStatus.SUCCESS, order: { status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] } } },
            ] },
            include: { order: { select: { orderCode: true, status: true, total: true } } },
            orderBy: { createdAt: 'asc' }, take: 100,
        });
    }

    async handleVnpayIpn(params: Record<string, string>) {
        try {
            if (!this.vnpayService.verifySignature(params)) return this.ack('97', 'Invalid checksum');
            if (!this.vnpayService.matchesMerchant(params.vnp_TmnCode)) return this.ack('97', 'Invalid merchant');
            const txnRef = params.vnp_TxnRef;
            const responseCode = params.vnp_ResponseCode;
            const transactionStatus = params.vnp_TransactionStatus;
            const transactionNo = params.vnp_TransactionNo;
            const amount = params.vnp_Amount;
            if (!txnRef || !responseCode || !transactionStatus || !transactionNo ||
                !/^[0-9]+$/.test(amount ?? '') || (params.vnp_CurrCode && params.vnp_CurrCode !== 'VND')) {
                return this.ack('99', 'Invalid request');
            }
            const saved = await this.prisma.payment.findUnique({
                where: { providerRef: txnRef }, include: { order: true },
            });
            if (!saved || saved.method !== PaymentMethod.VNPAY) return this.ack('01', 'Order not found');
            if (BigInt(amount) !== BigInt(Math.round(Number(saved.amount) * 100))) {
                return this.ack('04', 'Invalid amount');
            }
            if (saved.status === PaymentStatus.SUCCESS) {
                if (saved.vnpTransactionNo !== transactionNo || responseCode !== '00' || transactionStatus !== '00') {
                    return this.ack('99', 'Transaction mismatch');
                }
                // Đã ghi nhận tiền nhưng xử lý kho/điểm bị lỗi trước đó: có thể thử hoàn tất lại.
                if (saved.order.status === OrderStatus.PENDING || saved.order.status === OrderStatus.PAYMENT_FAILED) {
                    await this.finalizeConfirmedVnpay(saved.orderId);
                    return this.ack('00', 'Recovered successful payment');
                }
                return this.ack('02', 'Order already confirmed');
            }
            if (saved.status !== PaymentStatus.PENDING) return this.ack('02', 'Payment already processed');
            const succeeded = responseCode === '00' && transactionStatus === '00';
            // 01 = chưa hoàn tất; 04 = giao dịch đảo; 07 = nghi ngờ gian lận.
            // Không được tự chuyển FAILED khi ngân hàng chưa xác định kết quả cuối cùng.
            if (!succeeded && transactionStatus !== '02') {
                console.warn('VNPay requires manual reconciliation:', txnRef, transactionStatus);
                return this.ack('99', 'Transaction requires reconciliation');
            }
            if (succeeded) {
                // Ghi sổ kết quả gateway TRƯỚC: không được mất chứng cứ đã nhận tiền
                // chỉ vì kho/coupon/loyalty thay đổi trong lúc khách ở VNPay.
                const changed = await this.prisma.payment.updateMany({
                    where: { id: saved.id, status: PaymentStatus.PENDING },
                    data: { status: PaymentStatus.SUCCESS, vnpResponseCode: responseCode,
                        vnpTransactionNo: transactionNo, bankCode: params.vnp_BankCode || null,
                        paidAt: new Date() },
                });
                if (changed.count !== 1) return this.ack('02', 'Payment already processed');
                // Nếu bước này thất bại, payment SUCCESS + order PENDING là giao dịch cần đối soát,
                // không tự đánh dấu FAILED hoặc giả vờ đã hoàn tiền.
                await this.finalizeConfirmedVnpay(saved.orderId);
                return this.ack('00', 'Confirm Success');
            }
            await this.prisma.$transaction(async tx => {
                const payment = await tx.payment.updateMany({
                    where: { id: saved.id, status: PaymentStatus.PENDING },
                    data: { status: PaymentStatus.FAILED, vnpResponseCode: responseCode,
                        vnpTransactionNo: transactionNo, bankCode: params.vnp_BankCode || null },
                });
                if (payment.count !== 1) return;
                const order = await tx.order.findUniqueOrThrow({ where: { id: saved.orderId } });
                if (order.status === OrderStatus.PENDING) {
                    await tx.order.update({ where: { id: order.id },
                        data: { status: OrderStatus.PAYMENT_FAILED } });
                    await tx.orderStatusHistory.create({ data: {
                        orderId: order.id, fromStatus: OrderStatus.PENDING,
                        toStatus: OrderStatus.PAYMENT_FAILED,
                    }});
                }
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
            return this.ack('00', 'Confirm Success');
        } catch (error) {
            console.error('VNPay IPN processing failed; requires reconciliation:', error);
            return this.ack('99', 'Unknown error');
        }
    }

    // Chỉ ADMIN có quyền kích hoạt QueryDR; API chỉ cập nhật dữ liệu khi checksum hợp lệ.
    async recheckVnpay(role: string, orderId: string) {
        if (role !== 'ADMIN') throw new ForbiddenException('Chỉ quản trị viên được đối soát VNPay');
        const payment = await this.prisma.payment.findFirst({
            where: { orderId, method: PaymentMethod.VNPAY },
            orderBy: { createdAt: 'desc' }, include: { order: true },
        });
        if (!payment?.providerRef || !payment.vnpCreateDate) {
            throw new NotFoundException('Không tìm thấy giao dịch VNPay để truy vấn');
        }
        const gateway = await this.vnpayService.queryTransaction({
            txnRef: payment.providerRef, transactionDate: payment.vnpCreateDate, orderId,
        });
        // Không dùng vnp_ResponseCode riêng lẻ làm bằng chứng giao dịch đã thanh toán.
        const knownAmount = Number(payment.amount);
        if (gateway.responseCode !== '00') {
            return { message: 'VNPay chưa trả kết quả truy vấn thành công; không thay đổi DB', gateway };
        }
        if (!/^\d+$/.test(gateway.amount || '') ||
            BigInt(gateway.amount) !== BigInt(Math.round(knownAmount * 100))) {
            throw new ConflictException('QueryDR đã xác minh nhưng số tiền không khớp');
        }
        if (gateway.transactionType !== '01') {
            return { message: 'Giao dịch đã đổi loại, cần nhân viên đối soát thủ công', gateway };
        }
        if (gateway.transactionStatus === '00' && /^\d+$/.test(gateway.transactionNo || '')) {
            if (payment.status === PaymentStatus.FAILED) {
                throw new ConflictException('Gateway báo thành công nhưng DB lưu FAILED; cần đối soát thủ công');
            }
            if (payment.status === PaymentStatus.PENDING) {
                await this.prisma.payment.updateMany({
                    where: { id: payment.id, status: PaymentStatus.PENDING },
                    data: { status: PaymentStatus.SUCCESS,
                        vnpResponseCode: '00', vnpTransactionNo: gateway.transactionNo,
                        bankCode: gateway.bankCode || null, paidAt: new Date() },
                });
            }
            try {
                await this.finalizeConfirmedVnpay(orderId);
                const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId } });
                return { message: 'Đã đối soát giao dịch thành công', orderStatus: order.status, gateway };
            } catch (error) {
                console.error('VNPay đã thu tiền, không thể hoàn tất đơn:', orderId, error);
                return { message: 'VNPay đã thu tiền nhưng đơn chưa hoàn tất. Cần xử lý kho/hoàn tiền thủ công.',
                    requiresReconciliation: true, gateway };
            }
        }
        if (gateway.transactionStatus === '02' && payment.status === PaymentStatus.PENDING) {
            await this.prisma.$transaction(async tx => {
                const changed = await tx.payment.updateMany({
                    where: { id: payment.id, status: PaymentStatus.PENDING },
                    data: { status: PaymentStatus.FAILED, vnpResponseCode: gateway.responseCode,
                        vnpTransactionNo: gateway.transactionNo || null },
                });
                if (changed.count !== 1) return;
                const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
                if (order.status === OrderStatus.PENDING) {
                    await tx.order.updateMany({ where: { id: orderId, status: OrderStatus.PENDING },
                        data: { status: OrderStatus.PAYMENT_FAILED } });
                    await tx.orderStatusHistory.create({ data: { orderId,
                        fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PAYMENT_FAILED } });
                }
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
            return { message: 'Đã đồng bộ giao dịch thất bại xác thực từ VNPay', gateway };
        }
        return { message: 'VNPay vẫn đang xử lý/đã đảo giao dịch: giữ nguyên trạng thái để đối soát', gateway };
    }

    async handleVnpayReturn(params: Record<string, string>) {
        if (!this.vnpayService.verifySignature(params) ||
            !this.vnpayService.matchesMerchant(params.vnp_TmnCode)) {
            return { valid: false, message: 'Chữ ký VNPay không hợp lệ' };
        }
        const payment = await this.prisma.payment.findUnique({
            where: { providerRef: params.vnp_TxnRef },
            select: { orderId: true, status: true, amount: true },
        });
        if (!payment || !/^[0-9]+$/.test(params.vnp_Amount || '') ||
            BigInt(params.vnp_Amount) !== BigInt(Math.round(Number(payment.amount) * 100))) {
            return { valid: false, message: 'Không tìm thấy giao dịch hoặc sai số tiền' };
        }
        // Return không được cập nhật PAID: IPN mới là nguồn xác nhận.
        return { valid: true, orderId: payment.orderId, paymentStatus: payment.status,
            message: 'Vui lòng đợi xác nhận từ máy chủ' };
    }

    async getVnpayStatus(userId: string, orderId: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId },
            include: { payments: { where: { method: PaymentMethod.VNPAY },
                    orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
        const payment = order.payments[0];
        const requiresReconciliation = payment?.status === PaymentStatus.SUCCESS &&
            [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED].includes(order.status);
        const awaitingGateway = payment?.status === PaymentStatus.PENDING &&
            payment.createdAt.getTime() < Date.now() - 25 * 60_000;
        return { orderId: order.id, orderStatus: order.status,
            requiresReconciliation, awaitingGateway,
            payment: payment ? { status: payment.status, paidAt: payment.paidAt } : null };
    }
}
