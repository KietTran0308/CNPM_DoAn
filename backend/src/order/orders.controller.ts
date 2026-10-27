import {Type} from 'class-transformer';
import {Size} from '@prisma/client';

export {Size as ProductSize};
import {
    ArrayMinSize,
    ArrayUnique,
    IsArray,
    IsEnum,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    Min,
    ValidateNested
} from 'class-validator';

import {Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards, Headers} from '@nestjs/common';
import {JwtGuard, CurrentUser} from '../auth/jwt.guard';
import {OrdersService} from './orders.service';

export class OrderItemDto {
    @IsUUID('all')
    productId!: string;

    @IsEnum(Size)
    size!: Size;

    @IsInt()
    @Min(1)
    qty!: number;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsUUID('all', {each: true})
    toppingIds?: string[];
}

export class CreateOrderDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({each: true})
    @Type(() => OrderItemDto)
    items!: OrderItemDto[];

    @IsOptional()
    @IsString()
    @MaxLength(50)
    couponCode?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    pointsToUse?: number;
}

export class StatusDto {
    @IsIn(['PREPARING', 'READY', 'COMPLETED'])
    status!: 'PREPARING' | 'READY' | 'COMPLETED';
}


@Controller('orders')
@UseGuards(JwtGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {
    }

    @Post()
    create(
        @Req() req: { user: CurrentUser },
        @Headers('idempotency-key') key: string,
        @Body() dto: CreateOrderDto,
    ) {
        return this.ordersService.create(
            req.user.id,
            dto,
            key,
        );
    }

    @Get('me')
    mine(@Req() req: { user: CurrentUser }) {
        return this.ordersService.mine(req.user.id);
    }

    @Patch(':id/status')
    changeStatus(
        @Req() req: { user: CurrentUser },
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: StatusDto,
    ) {
        return this.ordersService.changeStatus(id, dto.status, req.user.role);
    }

    @Post(':id/cancel')
    cancel(
        @Req() req: { user: CurrentUser },
        @Param('id', new ParseUUIDPipe()) id: string,
    ) {
        return this.ordersService.cancel(id, req.user.id);
    }
}
