import {
    Body,
    Controller,
    Headers,
    Post,
    Req,
    UseGuards,
} from "@nestjs/common";

import { IsBoolean, IsIn, IsOptional, IsUUID } from "class-validator";

import { CurrentUser, JwtGuard } from "../auth/jwt.guard";
import { PaymentsService } from "./payments.service";

// Quy định dữ liệu mà client gửi khi thanh toán.
export class PaymentDto {
    @IsUUID('all')
    orderId!: string;

    @IsIn(["WALLET", "CARD"])
    method!: "WALLET" | "CARD";

    @IsOptional()
    @IsBoolean()
    simulateFailure?: boolean;
}

@Controller("payments")
@UseGuards(JwtGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post()
    pay(
        @Req() req: { user: CurrentUser },
        @Headers("idempotency-key") key: string,
        @Body() body: PaymentDto,
    ) {
        return this.paymentsService.pay(req.user.id, key, body);
    }
}
