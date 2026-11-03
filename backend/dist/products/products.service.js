"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.product.findMany({
            where: { isActive: true },
            select: {
                id: true,
                code: true,
                name: true,
                category: true,
                description: true,
                price: true,
                imageUrl: true,
                stock: true,
            },
            orderBy: { name: 'asc' },
        });
    }
    async getOptions(id) {
        await this.findById(id);
        const [sizes, toppings] = await Promise.all([
            this.prisma.productSizePrice.findMany({
                where: { productId: id },
                select: { size: true, price: true },
                orderBy: { price: 'asc' },
            }),
            this.prisma.topping.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    code: true,
                    name: true,
                    price: true,
                },
                orderBy: { name: 'asc' },
            }),
        ]);
        return { sizes, toppings };
    }
    async findById(id) {
        const product = await this.prisma.product.findFirst({
            where: {
                id,
                isActive: true,
            },
        });
        if (!product) {
            throw new common_1.NotFoundException("Không tìm thấy món");
        }
        return product;
    }
    async decreaseStock(productId, quantity, tx) {
        const db = tx ?? this.prisma;
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new common_1.BadRequestException("Số lượng không hợp lệ");
        }
        const product = await db.product.findUnique({
            where: { id: productId },
        });
        if (!product || !product.isActive) {
            throw new common_1.NotFoundException("Sản phẩm không tồn tại");
        }
        const result = await db.product.updateMany({
            where: {
                id: productId,
                version: product.version,
                stock: { gte: quantity },
                isActive: true,
            },
            data: {
                stock: { decrement: quantity },
                version: { increment: 1 },
            },
        });
        if (result.count === 0) {
            throw new common_1.BadRequestException("Không đủ tồn kho hoặc sản phẩm đã thay đổi");
        }
        return db.product.findUnique({
            where: { id: productId },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map