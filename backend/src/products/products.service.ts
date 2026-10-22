import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy danh sách món đang hoạt động
  async findAll() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  // Lấy danh sách size và topping
  async getOptions() {
    const [sizes, toppings] = await Promise.all([
      this.prisma.sizePrice.findMany(),
      this.prisma.topping.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
      }),
    ]);

    return { sizes, toppings };
  }

  // Lấy chi tiết món theo code
  async findById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException("Không tìm thấy món");
    }

    return product;
  }

  // Kiểm soát tồn kho đồng thời
  // Nhận thêm tham số tx (Transaction) để chạy chung luồng với tạo Order
  async decreaseStock(
    productId: string,
    quantity: number,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException("Số lượng không hợp lệ");
    }

    const result = await db.product.updateMany({
      where: {
        id: productId,
        stock: {
          gte: quantity,
        },
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    if (result.count === 0) {
      throw new BadRequestException(
        "Sản phẩm không tồn tại hoặc không đủ số lượng trong kho",
      );
    }

    return db.product.findUnique({
      where: { id: productId },
    });
  }
}
