import {Test, TestingModule} from '@nestjs/testing';
import {ProductsService} from './products.service';
import {NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma.service';

const mockPrismaService = {
    product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
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
    let prisma: PrismaService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                {provide: PrismaService, useValue: mockPrismaService},
            ],
        }).compile();

        service = module.get<ProductsService>(ProductsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('phải trả về danh sách sản phẩm', async () => {
            const expectedProducts = [{id: 1, name: 'Sản phẩm 1'}];
            mockPrismaService.product.findMany.mockResolvedValue(expectedProducts);

            const result = await service.findAll();
            expect(result).toEqual(expectedProducts);
            expect(mockPrismaService.product.findMany).toHaveBeenCalled();
        });
    });

    it('chỉ một trong hai đơn đồng thời được trừ tồn kho cuối cùng (version CAS)', async () => {
        let stock = 1;
        let version = 0;
        const tx: any = {
            product: {
                findUnique: jest.fn(async () => ({ id: 'p1', isActive: true, version, stock })),
                updateMany: jest.fn(async ({ where, data }: any) => {
                    if (version !== where.version || stock < where.stock.gte) return { count: 0 };
                    stock -= data.stock.decrement;
                    version += data.version.increment;
                    return { count: 1 };
                }),
            },
        };
        const result = await Promise.allSettled([
            service.decreaseStock('p1', 1, tx),
            service.decreaseStock('p1', 1, tx),
        ]);
        expect(result.filter(r => r.status === 'fulfilled')).toHaveLength(1);
        expect(result.filter(r => r.status === 'rejected')).toHaveLength(1);
        expect(stock).toBe(0);
    });

    describe('findById', () => {
        const productId = '00000000-0000-5000-8000-000000000001';

        it('phải trả về sản phẩm khi ID hợp lệ', async () => {
            const expectedProduct = {
                id: productId,
                name: 'Cappuccino',
                isActive: true,
            };

            mockPrismaService.product.findFirst.mockResolvedValue(expectedProduct);

            const result = await service.findById(productId);

            expect(result).toEqual(expectedProduct);

            expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
                where: {
                    id: productId,
                    isActive: true,
                },
            });
        });

        it('phải ném lỗi NotFoundException khi ID không tồn tại', async () => {
            mockPrismaService.product.findFirst.mockResolvedValue(null);

            await expect(
                service.findById('00000000-0000-5000-8000-000000000999'),
            ).rejects.toThrow(NotFoundException);
        });
    });
});