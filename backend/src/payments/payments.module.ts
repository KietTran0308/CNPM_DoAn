import { Module } from '@nestjs/common';
import { PaymentsController, VnpayPublicController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { VnpayService } from './vnpay.service';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../order/orders.module';

@Module({
  imports: [PrismaModule, AuthModule, OrdersModule],
  controllers: [PaymentsController, VnpayPublicController],
  providers: [PaymentsService, VnpayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
