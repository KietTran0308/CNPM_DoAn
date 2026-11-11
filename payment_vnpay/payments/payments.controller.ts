import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  UseGuards,
  Get,
  Query,
} from "@nestjs/common";

import { IsUUID, IsIn, IsOptional, IsBoolean } from "class-validator";

import { CurrentUser, JwtAuthGuard } from "../auth/jwt.guard";
import { PaymentsService } from "./payments.service";
import { Request } from "express";

interface AuthenticatedRequest extends Request {
  user: CurrentUser;
}

export class PaymentDto {
  @IsUUID("all")
  orderId!: string;
  @IsIn(["WALLET", "CARD"])
  method!: "WALLET" | "CARD";

  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;
}
export class CreateVnpayDto {
  @IsUUID("all")
  orderId!: string;
}

@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Thanh toán nội bộ hiện tại, giữ nguyên.
  @Post()
  pay(
    @Req() req: { user: CurrentUser },
    @Headers("idempotency-key") key: string,
    @Body()
    body: {
      orderId: string;
      method: "WALLET" | "CARD";
      simulateFailure?: boolean;
    },
  ) {
    return this.paymentsService.pay(req.user.id, key, body);
  }

  // Tạo URL thanh toán VNPay.
  @Post("vnpay")
  createVnpay(
    @Req() req: AuthenticatedRequest,
    @Headers("idempotency-key") key: string,
    @Body() body: CreateVnpayDto,
  ) {
    return this.paymentsService.createVnpay(
      req.user.id,
      key,
      body.orderId,
      req,
    );
  }

  // Truy vấn trạng thái thanh toán của đơn hiện tại.
  @Get("vnpay/status")
  getVnpayStatus(
    @Req() req: { user: CurrentUser },
    @Query("orderId") orderId: string,
  ) {
    return this.paymentsService.getVnpayStatus(req.user.id, orderId);
  }
}

// Controller public: VNPay không gửi JWT.
@Controller("payments/vnpay")
export class VnpayPublicController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // VNPay chuyển khách hàng về đây.
  @Get("return")
  returnPayment(@Query() query: Record<string, string>) {
    return this.paymentsService.handleVnpayReturn(query);
  }

  // VNPay gọi server-to-server.
  @Get("ipn")
  ipn(@Query() query: Record<string, string>) {
    return this.paymentsService.handleVnpayIpn(query);
  }
}
