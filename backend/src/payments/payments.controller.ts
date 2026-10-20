import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { JwtGuard, CurrentUser } from '../auth/jwt.guard';
import { PaymentsService } from './payments.service';

export class PaymentDto {
  @IsString() orderId!: string;
  @IsIn(['WALLET','CARD']) method!: 'WALLET'|'CARD';
  @IsOptional() @IsBoolean() simulateFailure?: boolean;
}
@Controller('payments')
@UseGuards(JwtGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post() pay(@Req() req: { user: CurrentUser }, @Headers('idempotency-key') key: string, @Body() body: PaymentDto) {
    return this.payments.pay(req.user.id, key, body);
  }
}
