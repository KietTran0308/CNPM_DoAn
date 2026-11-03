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
                imageUrl: true,
                imageKey: true,
                sizePrices: {
                    select: {
                        size: true,
                        price: true,
                    },
                    orderBy: {
                        size: "asc",
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });
    }
    async getOptions(id) {
        await this.findById(id);
        const [sizes, toppings] = await Promise.all([
            this.prisma.productSizePrice.findMany({
                where: { productId: id },
                select: { size: true, price: true },
                orderBy: { size: "asc" },
            }),
            this.prisma.topping.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    code: true,
                    name: true,
                    price: true,
                },
                orderBy: { name: "asc" },
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
            include: {
                sizePrices: {
                    orderBy: { size: "asc" },
                },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException("Không tìm thấy món");
        }
        return product;
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map