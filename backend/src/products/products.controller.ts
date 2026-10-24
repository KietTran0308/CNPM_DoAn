// backend/src/products/products.controller.ts

import { Controller, Get, Param } from '@nestjs/common';

@Controller('products')
export class ProductsController {
  
  // constructor(private readonly productsService: ProductsService) {}

  // Xử lý route: GET /products
  @Get()
  getAllProducts() {
    // TODO: Gọi Service để lấy danh sách products từ Database
    return {
      success: true,
      message: 'Lấy danh sách tất cả sản phẩm thành công',
      data: [] 
    };
  }

  // Xử lý route: GET /products/:id
  @Get(':id')
  getProductById(@Param('id') id: string) {
    // TODO: Gọi Service để lấy thông tin chi tiết của 1 product theo id
    return {
      success: true,
      message: `Lấy thông tin sản phẩm có id: ${id} thành công`,
      data: {
        id: id
      }
    };
  }
}