import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";

import { JwtGuard, CurrentUser } from "../../auth/jwt.guard";
import { OrdersService } from "./orders.service";
import { CreateOrderDto, StatusDto } from "../../../src/orders/dto/create-order.dto";

@Controller("orders")
@UseGuards(JwtGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Req() req: { user: CurrentUser }, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  @Get("me")
  mine(@Req() req: { user: CurrentUser }) {
    return this.ordersService.mine(req.user.id);
  }

  @Patch(":id/status")
  changeStatus(
    @Req() req: { user: CurrentUser },
    @Param("id") id: string,
    @Body() dto: StatusDto,
  ) {
    return this.ordersService.changeStatus(id, dto.status, req.user.role);
  }

  @Post(":id/cancel")
  cancel(@Req() req: { user: CurrentUser }, @Param("id") id: string) {
    return this.ordersService.cancel(id, req.user.id);
  }
}
