import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { CreateOrderDto } from './orders.controller';
import { assertTransition, calculateLine, OrderState } from './order-logic';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(userId: string, dto: CreateOrderDto) {
    try {
      return await this.prisma.$transaction(async tx => {
        let subtotal = 0;
        const items: { productId: string; size: string; toppings: string; qty: number; lineTotal: number }[] = [];
        for (const item of dto.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) throw new NotFoundException(`Không có món ${item.productId}`);
          // updateMany kiểm tra cả stock và version, tránh bán vượt số lượng khi nhiều người đặt cùng lúc.
          const changed = await tx.product.updateMany({
            where: { id: product.id, version: product.version, stock: { gte: item.qty } },
            data: { stock: { decrement: item.qty }, version: { increment: 1 } },
          });
          if (changed.count !== 1) throw new ConflictException(`Hết hàng / đang có người đặt món: ${product.name}`);
          const lineTotal = calculateLine(product.price, item.size, item.toppings, item.qty);
          subtotal += lineTotal;
          items.push({ productId: product.id, size: item.size, toppings: JSON.stringify(item.toppings), qty: item.qty, lineTotal });
        }
        let discount = 0;
        let voucherCode: string | null = null;
        if (dto.voucherCode?.trim()) {
          voucherCode = dto.voucherCode.trim().toUpperCase();
          const voucher = await tx.voucher.findUnique({ where: { code: voucherCode } });
          if (!voucher || !voucher.isActive) throw new BadRequestException('Voucher không tồn tại hoặc bị vô hiệu hóa');
          if (subtotal < voucher.minOrder) throw new BadRequestException(`Đơn tối thiểu ${voucher.minOrder}đ để sử dụng voucher`);
          discount = Math.min(subtotal, voucher.discountAmount);
        }
        return tx.order.create({
          data: { userId, subtotal, discount, voucherCode, total: subtotal - discount, items: { create: items } },
          include: { items: { include: { product: true } } },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (e: any) {
      if (e?.code === 'P2034') throw new ConflictException('Có đơn đặt đồng thời, vui lòng thử lại');
      throw e;
    }
  }
  mine(userId: string) {
    return this.prisma.order.findMany({ where: { userId }, include: { items: { include: { product: true } }, payments: true }, orderBy: { createdAt: 'desc' } });
  }
  async changeStatus(orderId: string, next: OrderState, role: string) {
    if (role !== 'STAFF' && role !== 'ADMIN') throw new ForbiddenException('Chỉ nhân viên được cập nhật pha chế');
    return this.prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Không tìm thấy đơn');
      try { assertTransition(order.status, next); } catch (e: any) { throw new BadRequestException(e.message); }
      const changed = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: { status: next as OrderStatus } });
      if (changed.count !== 1) throw new ConflictException('Trạng thái đơn vừa thay đổi, thử lại');
      return tx.order.findUniqueOrThrow({ where: { id: orderId } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
  async cancel(orderId: string, userId: string) {
    return this.prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order) throw new NotFoundException('Không tìm thấy đơn');
      if (order.userId !== userId) throw new ForbiddenException('Không có quyền hủy đơn này');
      try { assertTransition(order.status, 'CANCELLED'); } catch (e: any) { throw new BadRequestException(e.message); }
      const changed = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: { status: 'CANCELLED' } });
      if (changed.count !== 1) throw new ConflictException('Trạng thái đơn vừa thay đổi');
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty }, version: { increment: 1 } } });
      }
      return tx.order.findUniqueOrThrow({ where: { id: orderId } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
