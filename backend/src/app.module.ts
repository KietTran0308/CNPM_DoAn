import {Controller, Get, Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {PrismaService} from './prisma.service';
import {AuthController} from './auth/auth.controller';
import {AuthService} from './auth/auth.service';
import {ProductsController} from './products/products.controller';
import {OrdersController} from './orders/orders.controller';
import {OrdersService} from './orders/orders.service';
import {PricingService} from './orders/pricing.service';
import {PaymentsController} from './payments/payments.controller';
import {PaymentsService} from './payments/payments.service';
import { VouchersController } from './vouchers/vouchers.controller';
import {JwtGuard} from './auth/jwt.guard';

@Controller()
class HealthController {
    @Get('health') ping() {
        return {ok: true, app: 'BrewLite API'};
    }
}

@Module({
    imports: [JwtModule.register({
        secret: process.env.JWT_SECRET,
        signOptions: {expiresIn: '1d'},
    })],
    controllers: [HealthController, AuthController, ProductsController, OrdersController, PaymentsController, VouchersController],
    providers: [
        PrismaService,
        AuthService,
        JwtGuard,
        PricingService,
        OrdersService,
        PaymentsService
    ],
})
export class AppModule {
}
