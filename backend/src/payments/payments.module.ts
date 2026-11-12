import { Module } from '@nestjs/common';
import { PaymentsController, ZalopayPublicController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ZalopayService } from './zalopay.service';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../order/orders.module';

@Module({
  imports: [PrismaModule, AuthModule, OrdersModule],
  controllers: [PaymentsController, ZalopayPublicController],
  providers: [PaymentsService, ZalopayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
