import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './order/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';
import { VouchersModule } from './vouchers/vouchers.module';
import { RewardsModule } from './rewards/rewards.module';
@Controller('health')
class HealthController {
    constructor(private readonly prisma: PrismaService) {}
    @Get() async check() {
        try { await this.prisma.$queryRaw`SELECT 1`; return { status: 'ok', database: 'ok' }; }
        catch { throw new ServiceUnavailableException('Database chưa sẵn sàng'); }
    }
}
@Module({
    controllers: [HealthController],
    imports: [AuthModule, ProductsModule, OrdersModule, PaymentsModule,
        PrismaModule, VouchersModule, RewardsModule],
})
export class AppModule {}
