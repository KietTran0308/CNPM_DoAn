import { Type } from "class-transformer";
import { Size } from "@prisma/client";

export { Size as ProductSize };

import {
    ArrayMinSize,
    ArrayUnique,
    IsArray,
    IsEnum,
    IsIn,
    IsInt,
    Max,
    IsOptional,
    ValidateIf,
    IsString,
    IsUUID,
    MaxLength,
    Min,
    ValidateNested,
} from "class-validator";

import {
    Body,
    Controller,
    Get,
    Headers,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard, CurrentUser } from "../auth/jwt.guard";
import { OrdersService } from "./orders.service";

// Chọn nhiều suất cùng topping; giữ toppingIds để tương thích frontend cũ.
export class OrderToppingDto {
    @IsUUID("all")
    toppingId!: string;

    @IsInt()
    @Min(1)
    @Max(100)
    servings!: number;
}

export class OrderItemDto {
    @IsUUID("all")
    productId!: string;

    @IsEnum(Size)
    size!: Size;

    @IsInt() @Min(1) @Max(2147483647)
    qty!: number;

    @ValidateIf((_obj, value) => value !== undefined)
    @IsArray()
    @ArrayUnique()
    @IsUUID("all", { each: true })
    toppingIds?: string[];

    @ValidateIf((_obj, value) => value !== undefined)
    @IsArray()
    @ArrayUnique((t: OrderToppingDto | null) => t?.toppingId)
    @ValidateNested({ each: true })
    @Type(() => OrderToppingDto)
    toppings?: OrderToppingDto[];

    @IsOptional()
    @IsIn(["100%", "70%", "50%", "30%", "Ít đường"])
    sugar?: string;

    @IsOptional()
    @IsIn(["100%", "70%", "50%", "Ít đá", "Đá riêng"])
    ice?: string;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    note?: string;
}

export class CreateOrderDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items!: OrderItemDto[];

    @IsOptional()
    @IsString()
    @MaxLength(50)
    couponCode?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(2147483647)
    pointsToUse?: number;
}

export class StatusDto {
    @IsIn(["PREPARING", "READY", "COMPLETED"])
    status!: "PREPARING" | "READY" | "COMPLETED";
}

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    create(
        @Req() req: { user: CurrentUser },
        @Headers("idempotency-key") key: string,
        @Body() dto: CreateOrderDto,
    ) {
        return this.ordersService.create(req.user.id, dto, key);
    }

    @Get("me")
    mine(@Req() req: { user: CurrentUser }) {
        return this.ordersService.mine(req.user.id);
    }

    @Patch(":id/status")
    changeStatus(
        @Req() req: { user: CurrentUser },
        @Param("id", new ParseUUIDPipe()) id: string,
        @Body() dto: StatusDto,
    ) {
        return this.ordersService.changeStatus(
            id,
            dto.status,
            req.user.role,
            req.user.id,
        );
    }

    @Post(":id/cancel")
    cancel(
        @Req() req: { user: CurrentUser },
        @Param("id", new ParseUUIDPipe()) id: string,
    ) {
        return this.ordersService.cancel(id, req.user.id);
    }
}
