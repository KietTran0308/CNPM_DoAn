import { PrismaService } from "../prisma.service";
export declare class ProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
        code: string;
        category: string;
        description: string;
        imageUrl: string;
        imageKey: string;
        sizePrices: {
            size: import(".prisma/client").$Enums.Size;
            price: import("@prisma/client/runtime/library").Decimal;
        }[];
    }[]>;
    getOptions(id: string): Promise<{
        sizes: {
            size: import(".prisma/client").$Enums.Size;
            price: import("@prisma/client/runtime/library").Decimal;
        }[];
        toppings: {
            id: string;
            name: string;
            code: string;
            price: import("@prisma/client/runtime/library").Decimal;
        }[];
    }>;
    findById(id: string): Promise<{
        sizePrices: {
            productId: string;
            size: import(".prisma/client").$Enums.Size;
            price: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        name: string;
        code: string;
        category: string;
        description: string | null;
        imageUrl: string | null;
        imageKey: string | null;
        version: number;
        isActive: boolean;
    }>;
}
