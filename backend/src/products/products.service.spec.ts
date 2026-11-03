import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { ProductsService } from './products.service';

const PRODUCT_ID = 'c2109f91-894f-5836-872b-fc4c0f04ca5d';

const mockPrismaService = {
    product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
    },
    productSizePrice: {
        findMany: jest.fn(),
    },
    topping: {
        findMany: jest.fn(),
    },
};

describe('ProductsService', () => {
    let service: ProductsService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get<ProductsService>(ProductsService);
    });

    it('lay danh sach san pham voi imageKey va sizePrices tu PostgreSQL', async () => {
        const products = [
            {
                id: PRODUCT_ID,
                code: 'BL001',
                name: 'Cà phê sữa',
                category: 'Cà phê',
                description: 'Cà phê và sữa',
                imageUrl: null,
                imageKey: 'caPheSua',
                sizePrices: [
                    { size: 'S', price: new Prisma.Decimal(35000) },
                    { size: 'M', price: new Prisma.Decimal(35000) },
                    { size: 'L', price: new Prisma.Decimal(35000) },
                ],
            },
        ];
        mockPrismaService.product.findMany.mockResolvedValue(products);

        const result = await service.findAll();

        expect(result).toEqual(products);
        expect(result[0].sizePrices).toHaveLength(3);
        expect(result[0].sizePrices[0].price.toString()).toBe('35000');
        expect(result[0].imageKey).toBe('caPheSua');
        expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { isActive: true },
                select: expect.objectContaining({
                    imageKey: true,
                    sizePrices: expect.objectContaining({
                        orderBy: { size: 'asc' },
                    }),
                }),
            }),
        );
    });

    it('tra ve mang rong khi khong co san pham dang ban', async () => {
        mockPrismaService.product.findMany.mockResolvedValue([]);
        const result = await service.findAll();
        expect(result).toEqual([]);
    });

    it('lay chi tiet san pham kem bang gia theo size', async () => {
        const product = {
            id: PRODUCT_ID,
            name: 'Cà phê sữa',
            isActive: true,
            sizePrices: [{ size: 'M', price: new Prisma.Decimal(35000) }],
        };
        mockPrismaService.product.findFirst.mockResolvedValue(product);

        await expect(service.findById(PRODUCT_ID)).resolves.toEqual(product);
        expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
            where: { id: PRODUCT_ID, isActive: true },
            include: { sizePrices: { orderBy: { size: 'asc' } } },
        });
    });

    it('bao NotFoundException khi san pham khong ton tai/ngung ban', async () => {
        mockPrismaService.product.findFirst.mockResolvedValue(null);
        await expect(service.findById(PRODUCT_ID)).rejects.toThrow(NotFoundException);
    });

    it('tra ve size theo thu tu S/M/L va danh sach topping', async () => {
        mockPrismaService.product.findFirst.mockResolvedValue({
            id: PRODUCT_ID,
            isActive: true,
            sizePrices: [],
        });
        const sizes = [
            { size: 'S', price: new Prisma.Decimal(35000) },
            { size: 'M', price: new Prisma.Decimal(35000) },
            { size: 'L', price: new Prisma.Decimal(35000) },
        ];
        const toppings = [
            { id: '3075f104-4b54-59d0-a5af-0d8fa3ab2828', code: 'TP001', name: 'Trân châu đen', price: new Prisma.Decimal(5000) },
        ];
        mockPrismaService.productSizePrice.findMany.mockResolvedValue(sizes);
        mockPrismaService.topping.findMany.mockResolvedValue(toppings);

        const result = await service.getOptions(PRODUCT_ID);

        expect(result).toEqual({ sizes, toppings });
        expect(mockPrismaService.productSizePrice.findMany).toHaveBeenCalledWith({
            where: { productId: PRODUCT_ID },
            select: { size: true, price: true },
            orderBy: { size: 'asc' },
        });
        expect(mockPrismaService.topping.findMany).toHaveBeenCalledWith({
            where: { isActive: true },
            select: { id: true, code: true, name: true, price: true },
            orderBy: { name: 'asc' },
        });
    });
});
