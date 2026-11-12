import {
    BadGatewayException, BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { OrdersService } from '../order/orders.service';
import { assertTransition } from '../order/order-state';
import type { PaymentDto } from './payments.controller';
import { ZalopayService, ZaloCallback, ZalopayCreationRejectedError } from './zalopay.service';

type PaymentWithOrder = Prisma.PaymentGetPayload<{ include: { order: true } }>;

@Injectable()
export class PaymentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly zalopayService: ZalopayService,
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
            earnedPoints: status === PaymentStatus.SUCCESS && payment.order.status !== OrderStatus.CANCELLED
                ? Math.floor(Number(payment.amount) / 10000) : 0 };
    }

    // Cùng một DB transaction: không có PAID nếu thiếu kho, coupon hay điểm.
    // Dùng chung cho WALLET/CARD mock và ZaloPay callback.
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

    // Đơn 0 đồng được xác nhận trực tiếp bằng giao dịch nội bộ, KHÔNG giả mạo ZaloPay.
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
            throw new ForbiddenException('Thanh toán ví/thẻ mô phỏng đã tắt. Vui lòng sử dụng ZaloPay.');
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
                    where: { orderId: order.id, method: { in: [PaymentMethod.ZALOPAY, PaymentMethod.VNPAY] },
                        status: { in: [PaymentStatus.PENDING, PaymentStatus.SUCCESS] } },
                });
                if (pending) throw new ConflictException('Đơn có giao dịch cổng thanh toán cần xác minh; không được thanh toán mô phỏng thêm');
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

    // Giao dịch ZaloPay luôn lưu PENDING trước khi gọi API ngoại bộ. Nếu HTTP timeout,
    // giữ nguyên giao dịch để đối soát thay vì tạo app_trans_id thứ hai.
    async createZalopay(userId: string, rawKey: string | undefined, orderId: string) {
        const key = this.key(rawKey);
        this.zalopayService.assertConfigured();
        let wasCreated = false;
        const payment = await this.prisma.$transaction(async tx => {
            const existing = await tx.payment.findUnique({ where: { idempotencyKey: key }, include: { order: true } });
            if (existing) {
                if (existing.orderId !== orderId || existing.order.userId !== userId ||
                    existing.method !== PaymentMethod.ZALOPAY) {
                    throw new ConflictException('Idempotency-Key đã dùng cho yêu cầu khác');
                }
                if (existing.status !== PaymentStatus.PENDING) {
                    throw new ConflictException('Giao dịch đã có kết quả, xem lịch sử đơn');
                }
                return existing;
            }
            const order = await tx.order.findUnique({ where: { id: orderId } });
            if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
            if (order.userId !== userId) throw new ForbiddenException('Không thể thanh toán đơn người khác');
            if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAYMENT_FAILED) {
                throw new ConflictException('Đơn không còn chờ thanh toán');
            }
            if (!Number.isSafeInteger(Number(order.total)) || Number(order.total) <= 0) {
                throw new BadRequestException('Đơn phải có số tiền nguyên VND lớn hơn 0');
            }
            if (order.expiresAt.getTime() - Date.now() < 6 * 60_000) {
                throw new BadRequestException('Đơn sắp hết hạn, vui lòng tạo đơn mới');
            }
            // Cả giao dịch ZaloPay mới và VNPay cũ đều phải được bảo vệ khi chuyển cổng.
            const active = await tx.payment.findFirst({
                where: { orderId, status: { in: [PaymentStatus.PENDING, PaymentStatus.SUCCESS] },
                    method: { in: [PaymentMethod.ZALOPAY, PaymentMethod.VNPAY] } },
            });
            if (active) {
                if (active.method === PaymentMethod.ZALOPAY && active.status === PaymentStatus.PENDING) {
                    return { ...active, order };
                }
                throw new ConflictException('Đơn đã có giao dịch chưa đối soát hoặc đã thanh toán');
            }
            const anySuccess = await tx.payment.findFirst({ where: { orderId, status: PaymentStatus.SUCCESS } });
            if (anySuccess) throw new ConflictException('Đơn đã thanh toán');
            if (order.status === OrderStatus.PAYMENT_FAILED) {
                const changed = await tx.order.updateMany({ where: { id: orderId, status: OrderStatus.PAYMENT_FAILED },
                    data: { status: OrderStatus.PENDING } });
                if (changed.count !== 1) throw new ConflictException('Đơn vừa thay đổi');
                await tx.orderStatusHistory.create({ data: { orderId,
                        fromStatus: OrderStatus.PAYMENT_FAILED, toStatus: OrderStatus.PENDING } });
            }
            wasCreated = true;
            const appTransId = this.zalopayService.createTransactionId(randomUUID().replace(/-/g, '').slice(0, 24));
            const created = await tx.payment.create({ data: {
                    orderId, idempotencyKey: key, amount: order.total, method: PaymentMethod.ZALOPAY,
                    status: PaymentStatus.PENDING, providerRef: appTransId,
                }});
            return { ...created, order };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }).catch((error: any) => {
            if (error?.code === 'P2002' || error?.code === 'P2034') {
                throw new ConflictException('Giao dịch đang được tạo, vui lòng kiểm tra trước khi thử lại');
            }
            throw error;
        });
        if (payment.status !== PaymentStatus.PENDING) {
            throw new ConflictException('Giao dịch đã có kết quả, xem lịch sử đơn');
        }
        if (payment.zpOrderUrl) {
            return { paymentId: payment.id, orderId, amount: Number(payment.amount),
                status: payment.status, paymentUrl: payment.zpOrderUrl };
        }
        if (!wasCreated) {
            throw new ConflictException('Giao dịch ZaloPay đang chờ xác minh. Không tạo yêu cầu mới; hãy đối soát.');
        }
        let paymentUrl: string;
        try {
            paymentUrl = await this.zalopayService.createOrder({
                appTransId: payment.providerRef!, userId, amount: Number(payment.amount),
                orderId, expiresAt: payment.order.expiresAt,
            });
        } catch (error) {
            if (!(error instanceof ZalopayCreationRejectedError)) throw error;
            // ZaloPay đã TỪ CHỐI tạo đơn (VD: -53 sai HMAC), khác hoàn toàn timeout.
            // Cho phép sửa cấu hình rồi tạo giao dịch mới, nhưng không xóa dấu vết cũ.
            await this.prisma.$transaction(async tx => {
                const changed = await tx.payment.updateMany({
                    where: { id: payment.id, status: PaymentStatus.PENDING, zpOrderUrl: null },
                    data: { status: PaymentStatus.FAILED },
                });
                if (changed.count !== 1) {
                    throw new ConflictException('Giao dịch đã thay đổi; cần đối soát trước khi thử lại');
                }
                const orderChanged = await tx.order.updateMany({
                    where: { id: orderId, status: OrderStatus.PENDING },
                    data: { status: OrderStatus.PAYMENT_FAILED, updatedAt: new Date() },
                });
                if (orderChanged.count === 1) {
                    await tx.orderStatusHistory.create({
                        data: { orderId, fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PAYMENT_FAILED },
                    });
                }
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
            throw new BadGatewayException(
                error.subReturnCode === -53
                    ? 'ZaloPay từ chối tạo đơn (mã -53: sai HMAC). Kiểm tra Key1 đúng với AppID rồi thử lại.'
                    : `ZaloPay từ chối tạo đơn (mã ${error.subReturnCode}). Kiểm tra AppID, dữ liệu và cấu hình Sandbox.`,
            );
        }
        // Không đánh dấu FAILED nếu lưu URL lỗi: giao dịch gateway có thể vẫn còn tồn tại.
        await this.prisma.payment.updateMany({
            where: { id: payment.id, status: PaymentStatus.PENDING }, data: { zpOrderUrl: paymentUrl },
        });
        return { paymentId: payment.id, orderId, amount: Number(payment.amount),
            status: PaymentStatus.PENDING, paymentUrl };
    }

    private async finalizeConfirmedZalopay(orderId: string) {
        const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId } });
        if (order.status === OrderStatus.CANCELLED) {
            throw new ConflictException('ZaloPay đã thu tiền nhưng đơn bị hủy: cần xử lý hoàn tiền thực tế');
        }
        if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAYMENT_FAILED) return;
        await this.prisma.$transaction(async tx => { await this.finalizePaid(tx, orderId); },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    }

    async handleZalopayCallback(body: ZaloCallback) {
        try {
            const data = this.zalopayService.verifyCallback(body);
            if (!data) return { return_code: 2, return_message: 'Invalid MAC or data' };
            const payment = await this.prisma.payment.findUnique({
                where: { providerRef: data.app_trans_id }, include: { order: true },
            });
            if (!payment || payment.method !== PaymentMethod.ZALOPAY ||
                Number(payment.amount) !== data.amount) {
                return { return_code: 2, return_message: 'Unknown transaction or amount mismatch' };
            }
            const zpTransId = String(data.zp_trans_id);
            if (payment.status === PaymentStatus.FAILED ||
                (payment.status === PaymentStatus.SUCCESS && payment.zpTransId !== zpTransId)) {
                return { return_code: 2, return_message: 'Transaction status conflict, reconcile manually' };
            }
            // Bước ghi nhận TIỀN tách khỏi finalize kho/coupon: không làm mất giao dịch thành công.
            if (payment.status === PaymentStatus.PENDING) {
                await this.prisma.payment.updateMany({ where: { id: payment.id, status: PaymentStatus.PENDING },
                    data: { status: PaymentStatus.SUCCESS, zpTransId, paidAt: new Date() } });
            }
            const recorded = await this.prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
            if (recorded.status !== PaymentStatus.SUCCESS || recorded.zpTransId !== zpTransId) {
                return { return_code: 2, return_message: 'Concurrent payment conflict' };
            }
            await this.finalizeConfirmedZalopay(payment.orderId);
            return { return_code: 1, return_message: 'success' };
        } catch (error) {
            console.error('ZaloPay callback error (requires reconciliation):', error);
            return { return_code: 2, return_message: 'Retry later / reconcile' };
        }
    }

    async getReconciliationQueue(role: string) {
        if (role !== 'ADMIN') throw new ForbiddenException('Chỉ ADMIN được xem đối soát');
        const now = Date.now();
        const cutoff = new Date(now - 25 * 60_000);
        const createTimeout = new Date(now - 2 * 60_000);
        return this.prisma.payment.findMany({ where: { method: { in: [PaymentMethod.ZALOPAY, PaymentMethod.VNPAY] }, OR: [
                    // Không có URL sau 2 phút: có thể create API timeout, cần xem sớm hơn 25 phút.
                    { method: PaymentMethod.ZALOPAY, status: PaymentStatus.PENDING,
                        zpOrderUrl: null, createdAt: { lt: createTimeout } },
                    { status: PaymentStatus.PENDING, createdAt: { lt: cutoff } },
                    { status: PaymentStatus.SUCCESS,
                        order: { status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED] } } },
                ] }, include: { order: { select: { orderCode: true, status: true, total: true } } },
            orderBy: { createdAt: 'asc' }, take: 100 });
    }

    async recheckZalopay(role: string, orderId: string) {
        if (role !== 'ADMIN') throw new ForbiddenException('Chỉ ADMIN được đối soát');
        const payment = await this.prisma.payment.findFirst({
            where: { orderId, method: PaymentMethod.ZALOPAY }, orderBy: { createdAt: 'desc' },
            include: { order: true },
        });
        if (!payment?.providerRef) throw new NotFoundException('Không có giao dịch ZaloPay');
        const gateway = await this.zalopayService.queryOrder(payment.providerRef);
        if (gateway.returnCode === 1) {
            if (!Number.isSafeInteger(Number(gateway.amount)) || Number(gateway.amount) !== Number(payment.amount) ||
                !gateway.zpTransId || !/^\d+$/.test(gateway.zpTransId)) {
                throw new ConflictException('Giao dịch ZaloPay thành công nhưng số tiền/mã giao dịch không khớp');
            }
            if (payment.status === PaymentStatus.FAILED) {
                throw new ConflictException('DB FAILED, ZaloPay SUCCESS: cần xử lý thủ công');
            }
            if (payment.status === PaymentStatus.SUCCESS && payment.zpTransId !== gateway.zpTransId) {
                throw new ConflictException('Giao dịch ZaloPay không khớp mã giao dịch đã ghi nhận');
            }
            if (payment.status === PaymentStatus.PENDING) {
                // Callback và thao tác đối soát có thể chạy đồng thời. Chỉ cập nhật PENDING một lần.
                await this.prisma.payment.updateMany({ where: { id: payment.id, status: PaymentStatus.PENDING },
                    data: { status: PaymentStatus.SUCCESS, zpTransId: gateway.zpTransId, paidAt: new Date() } });
            }
            // Đọc lại kết quả đã commit: không finalize nếu callback đồng thời ghi mã khác.
            const recorded = await this.prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
            if (recorded.status !== PaymentStatus.SUCCESS || recorded.zpTransId !== gateway.zpTransId) {
                throw new ConflictException('Kết quả đối soát thay đổi trong lúc xử lý; cần kiểm tra thủ công');
            }
            try {
                await this.finalizeConfirmedZalopay(orderId);
                const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId } });
                return { message: 'Đã đối soát thành công', orderStatus: order.status, gateway };
            } catch (error) {
                console.error('ZaloPay thu tiền nhưng không finalize được:', orderId, error);
                return { message: 'ZaloPay đã thu tiền, đơn chưa xử lý được. Cần xử lý kho hoặc hoàn tiền thủ công.',
                    requiresReconciliation: true, gateway };
            }
        }
        // Chỉ kết thúc giao dịch nếu gateway trả thất bại do QUÁ HẠN, đã hết hạn đơn
        // và gateway không còn xử lý. Các lỗi còn lại vẫn cần đối soát vì có thể tạm thời.
        // -101 ORDER_NOT_EXIST chỉ được xử lý khi giao dịch KHÔNG có URL,
        // đã quá 30 phút và đơn đã hết hạn. Không kết luận thất bại nếu còn trong
        // cửa sổ xử lý, vì QueryDR -101 có thể xuất hiện khi tạo đơn timeout.
        const oldMissingGatewayOrder = gateway.returnCode === 2 && gateway.subReturnCode === -101 &&
            !gateway.isProcessing && payment.zpOrderUrl === null &&
            payment.createdAt instanceof Date && payment.createdAt.getTime() < Date.now() - 30 * 60_000 &&
            payment.order.expiresAt <= new Date();
        if (gateway.returnCode === 2 &&
            ((gateway.subReturnCode === -54 && !gateway.isProcessing && payment.order.expiresAt <= new Date()) ||
                oldMissingGatewayOrder)) {
            if (payment.status === PaymentStatus.SUCCESS) {
                throw new ConflictException('DB đã nhận tiền nhưng gateway trả thất bại: phải đối soát thủ công');
            }
            if (payment.status === PaymentStatus.PENDING) {
                await this.prisma.$transaction(async tx => {
                    const changed = await tx.payment.updateMany({
                        where: { id: payment.id, status: PaymentStatus.PENDING },
                        data: { status: PaymentStatus.FAILED },
                    });
                    if (changed.count !== 1) throw new ConflictException('Giao dịch đã thay đổi, kiểm tra lại');
                    const updatedOrder = await tx.order.updateMany({
                        where: { id: orderId, status: OrderStatus.PENDING },
                        data: { status: OrderStatus.PAYMENT_FAILED, updatedAt: new Date() },
                    });
                    if (updatedOrder.count === 1) await tx.orderStatusHistory.create({
                        data: { orderId, fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PAYMENT_FAILED },
                    });
                }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
            }
            return { message: oldMissingGatewayOrder
                    ? 'ZaloPay xác nhận không có giao dịch sau 30 phút; đã kết thúc giao dịch lỗi. Đặt đơn mới nếu muốn mua.'
                    : 'ZaloPay xác nhận giao dịch đã hết hạn và thất bại. Đơn đã hết hạn; cần tạo đơn mới nếu muốn mua.',
                gateway, paymentStatus: PaymentStatus.FAILED };
        }
        // return_code=2 có nhiều mã lỗi, không coi mọi lỗi là kết quả cuối cùng.
        return { message: gateway.returnCode === 3
                ? 'Giao dịch còn xử lý; không tạo thanh toán mới'
                : 'ZaloPay không xác nhận thanh toán thành công. Cần kiểm tra mã lỗi trước khi đóng giao dịch', gateway };
    }

    async getZalopayStatus(userId: string, orderId: string) {
        const order = await this.prisma.order.findFirst({ where: { id: orderId, userId },
            include: { payments: { where: { method: { in: [PaymentMethod.ZALOPAY, PaymentMethod.VNPAY] } },
                    orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
        const payment = order.payments[0];
        return { orderId: order.id, orderStatus: order.status,
            requiresReconciliation: payment?.status === PaymentStatus.SUCCESS &&
                (order.status === OrderStatus.PENDING ||
                    order.status === OrderStatus.PAYMENT_FAILED ||
                    order.status === OrderStatus.CANCELLED),
            awaitingGateway: payment?.status === PaymentStatus.PENDING && (
                payment.createdAt.getTime() < Date.now() - 25 * 60_000 ||
                order.expiresAt <= new Date() ||
                (payment.method === PaymentMethod.ZALOPAY && !payment.zpOrderUrl &&
                    payment.createdAt.getTime() < Date.now() - 2 * 60_000)
            ),
            payment: payment ? {
                method: payment.method, status: payment.status, paidAt: payment.paidAt,
                // Chỉ chủ đơn nhận URL ZaloPay cũ, và chỉ khi giao dịch còn thời hạn.
                paymentUrl: payment.method === PaymentMethod.ZALOPAY &&
                payment.status === PaymentStatus.PENDING && order.expiresAt > new Date()
                    ? payment.zpOrderUrl : null,
            } : null };
    }
}
