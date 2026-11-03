import { Test, TestingModule } from "@nestjs/testing";
import { ProductsService } from "./products.service";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

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

describe("ProductsService", () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("phải trả về danh sách sản phẩm", async () => {
      const expectedProducts = [{ id: 1, name: "Sản phẩm 1" }];
      mockPrismaService.product.findMany.mockResolvedValue(expectedProducts);

      const result = await service.findAll();
      expect(result).toEqual(expectedProducts);
      expect(mockPrismaService.product.findMany).toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("phải trả về danh sách sản phẩm kèm theo giá theo size", async () => {
      const expectedProducts = [
        {
          id: "product-1",
          code: "CF001",
          name: "Cà phê sữa",
          category: "COFFEE",
          description: "Cà phê sữa",
          imageUrl: null,
          productSizePrices: [
            { size: "M", price: 30000 },
            { size: "L", price: 35000 },
          ],
        },
      ];
      mockPrismaService.product.findMany.mockResolvedValue(expectedProducts);

      const result = await service.findAll();

      expect(result).toEqual(expectedProducts);
      // Kiểm tra mảng giá theo size có 2 phần tử như đã mock
      expect(result[0].productSizePrices).toHaveLength(2);
      // Kiểm tra giá của size M
      expect(result[0].productSizePrices[0].price).toBe(30000);
      expect(mockPrismaService.product.findMany).toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    const productId = "00000000-0000-5000-8000-000000000001";

    it("phải trả về sản phẩm khi ID hợp lệ", async () => {
      const expectedProduct = {
        id: productId,
        name: "Cappuccino",
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

    it("phải ném lỗi NotFoundException khi ID không tồn tại", async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(
        service.findById("00000000-0000-5000-8000-000000000999"),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
