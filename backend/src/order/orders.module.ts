import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { OrdersController } from './orders.controller';
import { OrdersService, PricingService } from './orders.service';

@Module({
    imports: [AuthModule, ProductsModule],
    controllers: [OrdersController],
    providers: [OrdersService, PricingService],
})
export class OrdersModule {}
