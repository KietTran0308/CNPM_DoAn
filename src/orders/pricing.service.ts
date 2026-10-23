import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { OrderItemDto } from "./dto/create-order.dto";
import { calculateLine } from "./order-logic";

@Injectable()
export class PricingService {
  async calculateItem(tx: Prisma.TransactionClient, item: OrderItemDto) {
    const product = await tx.product.findUnique({
      where: { code: item.productCode },
    });

    if (!product || !product.isActive) {
      throw new BadRequestException("Sản phẩm không hợp lệ");
    }

    const size = await tx.sizePrice.findUnique({
      where: { size: item.size },
    });

    if (!size) {
      throw new BadRequestException("Size không hợp lệ");
    }

    const toppingCodes = item.toppingCodes ?? [];

    const toppings = await tx.topping.findMany({
      where: {
        code: { in: toppingCodes },
        isActive: true,
      },
    });

    if (toppings.length !== toppingCodes.length) {
      throw new BadRequestException("Có topping không hợp lệ");
    }

    const productPrice = Number(product.price);
    const sizeExtraPrice = Number(size.extraPrice);
    const toppingPrices = toppings.map((topping) => Number(topping.price));

    const unitPrice = productPrice + sizeExtraPrice;

    const lineTotal = calculateLine(
      productPrice,
      sizeExtraPrice,
      toppingPrices,
      item.qty,
    );

    if (
      !Number.isFinite(lineTotal) ||
      lineTotal < 0 ||
      !Number.isSafeInteger(lineTotal)
    ) {
      throw new BadRequestException("Giá tiền không hợp lệ");
    }

    return {
      product,
      toppings,
      unitPrice,
      lineTotal,
    };
  }
}
