import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { OrderItemDto } from './orders.controller';

@Injectable()
export class PricingService {
    async calculateItem(tx: Prisma.TransactionClient, item: OrderItemDto) {
        const product = await tx.product.findUnique({
            where: { code: item.productCode },
        });
        if (!product || !product.isActive) {
            throw new BadRequestException('Sản phẩm không hợp lệ');
        }

        const size = await tx.sizePrice.findUnique({
            where: { size: item.size },
        });
        if (!size) throw new BadRequestException('Size không hợp lệ');

        const codes = item.toppingCodes || [];
        const toppings = await tx.topping.findMany({
            where: { code: { in: codes }, isActive: true },
        });
        if (toppings.length !== codes.length) {
            throw new BadRequestException('Có topping không hợp lệ');
        }

        const unitPrice = Number(product.price) + Number(size.extraPrice);
        const toppingTotal = toppings.reduce((s, t) => s + Number(t.price), 0);
        const lineTotal = (unitPrice + toppingTotal) * item.qty;
        if (!Number.isSafeInteger(lineTotal)) {
            throw new BadRequestException('Giá tiền không hợp lệ');
        }
        return { product, toppings, unitPrice, lineTotal };
    }
}
