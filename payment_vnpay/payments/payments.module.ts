import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import {
  PaymentsController,
  VnpayPublicController,
} from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { VnpayService } from "./vnpay.service";

import { PrismaModule } from "../prisma.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, AuthModule, ConfigModule],
  controllers: [PaymentsController, VnpayPublicController],
  providers: [PaymentsService, VnpayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
