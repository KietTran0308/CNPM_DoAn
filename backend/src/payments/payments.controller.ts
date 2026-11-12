import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import type { Request, Response } from 'express';
import { CurrentUser, JwtAuthGuard } from '../auth/jwt.guard';
import { PaymentsService } from './payments.service';

export class PaymentDto {
  @IsUUID('all') orderId!: string;
  @IsIn(['WALLET', 'CARD']) method!: 'WALLET' | 'CARD';
  @IsOptional() @IsBoolean() simulateFailure?: boolean;
}
export class CreateVnpayDto {
  @IsUUID('all') orderId!: string;
}
export class CompleteZeroTotalDto {
  @IsUUID('all') orderId!: string;
}

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
  @Post()
  pay(@Req() req: { user: CurrentUser }, @Headers('idempotency-key') key: string,
      @Body() body: PaymentDto) {
    return this.paymentsService.pay(req.user.id, key, body);
  }
  @Post('zero')
  completeZeroTotal(@Req() req: { user: CurrentUser }, @Body() body: CompleteZeroTotalDto) {
    return this.paymentsService.completeZeroTotal(req.user.id, body.orderId);
  }
  @Post('vnpay')
  createVnpay(@Req() req: Request & { user: CurrentUser },
      @Headers('idempotency-key') key: string, @Body() body: CreateVnpayDto) {
    return this.paymentsService.createVnpay(req.user.id, key, body.orderId, req);
  }
  @Post('vnpay/recheck/:orderId')
  recheck(@Req() req: { user: CurrentUser }, @Param('orderId', new ParseUUIDPipe()) orderId: string) {
    return this.paymentsService.recheckVnpay(req.user.role, orderId);
  }
  @Get('vnpay/reconciliation')
  reconciliation(@Req() req: { user: CurrentUser }) {
    return this.paymentsService.getReconciliationQueue(req.user.role);
  }
  @Get('vnpay/status')
  getVnpayStatus(@Req() req: { user: CurrentUser }, @Query('orderId', new ParseUUIDPipe()) orderId: string) {
    return this.paymentsService.getVnpayStatus(req.user.id, orderId);
  }
}

@Controller('payments/vnpay')
export class VnpayPublicController {
  constructor(private readonly paymentsService: PaymentsService) {}
  // Return chỉ điều hướng trình duyệt. Không thay đổi trạng thái giao dịch tại endpoint này.
  @Get('return')
  async returnPayment(@Query() query: Record<string, string>, @Res() res: Response) {
    const result = await this.paymentsService.handleVnpayReturn(query);
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
    const url = new URL('/payment-result', frontend);
    if (result.valid && result.orderId) url.searchParams.set('orderId', result.orderId);
    else url.searchParams.set('error', 'invalid');
    return res.redirect(302, url.toString());
  }
  @Get('ipn')
  ipn(@Query() query: Record<string, string>) {
    return this.paymentsService.handleVnpayIpn(query);
  }
}
