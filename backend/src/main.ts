
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './AppModule';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    const allowedOrigins = (
        process.env.FRONTEND_URL || 'http://localhost:3000'
    )
        .split(',')
        .map(origin => origin.trim());

    app.enableCors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Idempotency-Key',
        ],
    });

    const port = Number(process.env.PORT) || 4000;
    await app.listen(port, '0.0.0.0');
}

bootstrap();
