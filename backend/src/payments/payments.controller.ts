import { Body, Controller, Get, Headers, HttpCode, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import { CurrentUser, JwtAuthGuard } from '../auth/jwt.guard';
import { PaymentsService } from './payments.service';
import type { ZaloCallback } from './zalopay.service';

export class PaymentDto {
    @IsUUID('all') orderId!: string;
    @IsIn(['WALLET', 'CARD']) method!: 'WALLET' | 'CARD';
    @IsOptional() @IsBoolean() simulateFailure?: boolean;
}
export class CreateZalopayDto { @IsUUID('all') orderId!: string; }
export class CompleteZeroTotalDto { @IsUUID('all') orderId!: string; }

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}
    @Post()
    pay(@Req() req: {user: CurrentUser}, @Headers('idempotency-key') key: string, @Body() body: PaymentDto) {
        return this.paymentsService.pay(req.user.id, key, body);
    }
    @Post('zero')
    completeZeroTotal(@Req() req: {user: CurrentUser}, @Body() body: CompleteZeroTotalDto) {
        return this.paymentsService.completeZeroTotal(req.user.id, body.orderId);
    }
    @Post('zalopay')
    createZalopay(@Req() req: {user: CurrentUser}, @Headers('idempotency-key') key: string,
                  @Body() body: CreateZalopayDto) {
        return this.paymentsService.createZalopay(req.user.id, key, body.orderId);
    }
    @Post('zalopay/recheck/:orderId')
    recheck(@Req() req: {user: CurrentUser}, @Param('orderId', new ParseUUIDPipe()) orderId: string) {
        return this.paymentsService.recheckZalopay(req.user.role, orderId);
    }
    @Get('zalopay/reconciliation')
    reconciliation(@Req() req: {user: CurrentUser}) {
        return this.paymentsService.getReconciliationQueue(req.user.role);
    }
    @Get('zalopay/status')
    status(@Req() req: {user: CurrentUser}, @Query('orderId', new ParseUUIDPipe()) orderId: string) {
        return this.paymentsService.getZalopayStatus(req.user.id, orderId);
    }
}

@Controller('payments/zalopay')
export class ZalopayPublicController {
    constructor(private readonly paymentsService: PaymentsService) {}
    // Callback được kiểm tra HMAC Key2 tại PaymentsService. Không mở API trả tiền bằng GET.
    @Post('callback')
    @HttpCode(200) // ZaloPay callback phải được ACK bằng HTTP 200. NestJS POST mặc định HTTP 201.
    callback(@Body() body: ZaloCallback) {
        return this.paymentsService.handleZalopayCallback(body);
    }
}
