import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
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

    // GET /products/:id/options
    @Get(':id/options')
    getOptions(@Param('id', new ParseUUIDPipe({ version: '5' })) id: string) {
        return this.productsService.getOptions(id);
    }

    // GET /products/:id
    @Get(':id')
    findById(@Param('id', new ParseUUIDPipe({ version: '5' })) id: string) {
        return this.productsService.findById(id);
    }
}
