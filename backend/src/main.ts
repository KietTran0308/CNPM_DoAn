import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    throw new Error('Thiếu DATABASE_URL hoặc JWT_SECRET trong biến môi trường');
  }
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(Number(process.env.PORT ?? 4000), '0.0.0.0');
  console.log('BrewLite API: http://localhost:4000/health');
}
bootstrap();
