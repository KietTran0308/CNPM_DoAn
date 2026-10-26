import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [VouchersController],
})
export class VouchersModule {}