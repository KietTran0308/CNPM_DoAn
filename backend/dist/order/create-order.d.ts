export declare enum ProductSize {
    S = "S",
    M = "M",
    L = "L"
}
export declare class OrderItemDto {
    productId: string;
    size: ProductSize;
    qty: number;
    toppingIds?: string[];
}
export declare class CreateOrderDto {
    items: OrderItemDto[];
    couponCode?: string;
}
