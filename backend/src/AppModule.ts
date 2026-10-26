import { Controller, Get, Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './order/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from './prisma.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { RewardsModule } from './rewards/rewards.module';

@Controller('health')
class HealthController {
    @Get() check() { return { status: 'ok' }; }
}

@Module({
    controllers: [HealthController],
    imports: [
        AuthModule,
        ProductsModule,
        OrdersModule,
        PaymentsModule,
        PrismaModule,
        VouchersModule,
        RewardsModule
    ],
})
export class AppModule {}