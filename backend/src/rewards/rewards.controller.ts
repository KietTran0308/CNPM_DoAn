import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsUUID } from 'class-validator';
import { JwtGuard, CurrentUser } from '../auth/jwt.guard';
import { RewardsService } from './rewards.service';

class RedeemDto {
  @IsIn(['pt-50', 'pt-100', 'pt-150', 'pt-200', 'pt-300']) rewardId!: string;
  @IsUUID('4') requestId!: string;
}
@Controller('rewards') @UseGuards(JwtGuard)
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}
  @Get('catalog') catalog() { return this.rewards.getCatalog(); }
  @Get('history') history(@Req() req: { user: CurrentUser }) { return this.rewards.history(req.user.id); }
  @Post('redeem') redeem(@Req() req: { user: CurrentUser }, @Body() d: RedeemDto) {
    return this.rewards.redeem(req.user.id, d.rewardId, d.requestId);
  }
}
