import { Module } from "@nestjs/common";

import { PrismaService } from "../prisma.service";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { PricingService } from "./pricing.service";

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PricingService, PrismaService],
})
export class OrdersModule {}
