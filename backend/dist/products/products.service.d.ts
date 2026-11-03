import { PrismaService } from "../prisma.service";
import { Prisma } from "@prisma/client";
export declare class ProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
        code: string;
        category: string;
        description: string;
        price: Prisma.Decimal;
        imageUrl: string;
        stock: number;
    }[]>;
    getOptions(id: string): Promise<{
        sizes: {
            price: Prisma.Decimal;
            size: import(".prisma/client").$Enums.Size;
        }[];
        toppings: {
            id: string;
            name: string;
            code: string;
            price: Prisma.Decimal;
        }[];
    }>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        code: string;
        category: string;
        description: string | null;
        price: Prisma.Decimal;
        imageUrl: string | null;
        stock: number;
        version: number;
        isActive: boolean;
    }>;
    decreaseStock(productId: string, quantity: number, tx?: Prisma.TransactionClient): Promise<{
        id: string;
        name: string;
        code: string;
        category: string;
        description: string | null;
        price: Prisma.Decimal;
        imageUrl: string | null;
        stock: number;
        version: number;
        isActive: boolean;
    }>;
}
