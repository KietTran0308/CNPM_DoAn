import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(): Promise<{
        id: string;
        name: string;
        code: string;
        category: string;
        description: string;
        price: import("@prisma/client/runtime/library").Decimal;
        imageUrl: string;
        stock: number;
    }[]>;
    getOptions(id: string): Promise<{
        sizes: {
            price: import("@prisma/client/runtime/library").Decimal;
            size: import(".prisma/client").$Enums.Size;
        }[];
        toppings: {
            id: string;
            name: string;
            code: string;
            price: import("@prisma/client/runtime/library").Decimal;
        }[];
    }>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        code: string;
        category: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        imageUrl: string | null;
        stock: number;
        version: number;
        isActive: boolean;
    }>;
}
