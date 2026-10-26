import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';
import {JwtModule} from "@nestjs/jwt";
import {PrismaModule} from "../prisma.module";
import {Module} from "@nestjs/common";

if (!process.env.JWT_SECRET) {
    throw new Error('Thiếu JWT_SECRET trong file .env');
}

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtGuard],
    exports: [JwtGuard, JwtModule],
})
export class AuthModule {}