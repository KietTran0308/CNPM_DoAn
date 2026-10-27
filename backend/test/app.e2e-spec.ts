import 'dotenv/config';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');

import { AppModule } from '../src/AppModule';

describe('BrewLite API E2E', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule =
            await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

        app = moduleFixture.createNestApplication();

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /health trả về 200', async () => {
        await request(app.getHttpServer())
            .get('/health')
            .expect(200)
            .expect({ status: 'ok' });
    });

    it('GET /products trả về danh sách', async () => {
        const response = await request(app.getHttpServer())
            .get('/products')
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /orders không JWT trả về 401', async () => {
        await request(app.getHttpServer())
            .post('/orders')
            .send({ items: [] })
            .expect(401);
    });
});