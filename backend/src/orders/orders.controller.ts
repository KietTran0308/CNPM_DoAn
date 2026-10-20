import {Body, Controller, Get, Param, Patch, Post, Req, UseGuards} from '@nestjs/common';
import {Type} from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    ArrayUnique,
    IsArray,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested
} from 'class-validator';
import {JwtGuard, CurrentUser} from '../auth/jwt.guard';
import {OrdersService} from './orders.service';

export class OrderItemDto {
    @IsString()
    productCode!: string;

    @IsIn(['S', 'M', 'L'])
    size!: 'S' | 'M' | 'L';

    @IsArray()
    @ArrayUnique()
    @ArrayMaxSize(8)
    @IsString({ each: true })
    toppingCodes!: string[];

    @IsInt()
    @Min(1)
    @Max(20)
    qty!: number;
}

export class CreateOrderDto {
    @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({each: true}) @Type(() => OrderItemDto)
    items!: OrderItemDto[];
    @IsOptional() @IsString() voucherCode?: string;
}

export class StatusDto {
    @IsIn(['PREPARING', 'READY', 'COMPLETED']) status!: 'PREPARING' | 'READY' | 'COMPLETED';
}

@Controller('orders')
@UseGuards(JwtGuard)
export class OrdersController {
    constructor(private readonly orders: OrdersService) {
    }

    @Post() create(@Req() req: { user: CurrentUser }, @Body() body: CreateOrderDto) {
        return this.orders.create(req.user.id, body);
    }

    @Get('me') mine(@Req() req: { user: CurrentUser }) {
        return this.orders.mine(req.user.id);
    }

    @Patch(':id/status') status(@Req() req: { user: CurrentUser }, @Param('id') id: string, @Body() body: StatusDto) {
        return this.orders.changeStatus(id, body.status, req.user.role);
    }

    @Post(':id/cancel') cancel(@Req() req: { user: CurrentUser }, @Param('id') id: string) {
        return this.orders.cancel(id, req.user.id);
    }
}
