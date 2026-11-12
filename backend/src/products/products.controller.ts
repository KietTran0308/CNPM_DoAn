import { Controller, Get, Post, Body, Req, UseGuards, Param, ParseUUIDPipe } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt.guard';

class RestockDto {
    @IsUUID('all') ingredientId!: string;
    @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(1000000) quantity!: number;
    @IsOptional() @IsString() @MaxLength(250) note?: string;
}

import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
    ) {}

    // GET /products
    @Get()
    findAll() {
        return this.productsService.findAll();
    }

    @Get('toppings')
    findToppings() {
        return this.productsService.findToppings();
    }

    @UseGuards(JwtAuthGuard)
    @Get('inventory')
    inventory(@Req() req: { user: CurrentUser }) {
        return this.productsService.inventory(req.user.role);
    }

    @UseGuards(JwtAuthGuard)
    @Post('inventory/restock')
    restock(@Req() req: { user: CurrentUser }, @Body() dto: RestockDto) {
        return this.productsService.restock(req.user.id, req.user.role, dto);
    }

    // GET /products/:id/options
    @Get(':id/options')
    getOptions(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.productsService.getOptions(id);
    }

    // GET /products/:id
    @Get(':id')
    findById(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.productsService.findById(id);
    }
}
