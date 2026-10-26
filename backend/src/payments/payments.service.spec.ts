import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../prisma.service';
import { PaymentsService } from './payments.service';

const userId = '0abd345f-7157-5376-bdf7-d23459d5c505';
const orderId = '33288bf2-7b4a-50b7-94e9-f949a5190459';
const body = { orderId, method: 'WALLET' as const, simulateFailure: false };

// Kiểm thử các trường hợp replay mà không kết nối database thật.
describe('PaymentsService - idempotency', () => {
    it('trả kết quả cũ khi cùng key và cùng yêu cầu', async () => {
        const oldPayment = {
            id: 'payment-1', orderId, method: 'WALLET', status: 'SUCCESS',
            order: { id: orderId, userId, status: 'PAID' },
        };
        const findUnique = jest.fn(async () => oldPayment);
        const transaction = jest.fn(async () => { throw new Error('Không được chạy transaction'); });
        const prisma = {
            payment: { findUnique },
            $transaction: transaction,
        } as unknown as PrismaService;

        const service = new PaymentsService(prisma);
        const result = await service.pay(userId, 'payment-key-123', body);

        expect(result.replay).toBe(true);
        expect(result.payment).toEqual(oldPayment);
        expect(transaction).not.toHaveBeenCalled();
    });

    it('từ chối dùng lại cùng key cho yêu cầu khác', async () => {
        const oldPayment = {
            id: 'payment-1', orderId, method: 'CARD', status: 'SUCCESS',
            order: { id: orderId, userId, status: 'PAID' },
        };
        const prisma = {
            payment: { findUnique: jest.fn(async () => oldPayment) },
        } as unknown as PrismaService;

        const service = new PaymentsService(prisma);
        await expect(service.pay(userId, 'payment-key-123', body))
            .rejects.toThrow(ConflictException);
    });

    it('từ chối key ngắn hơn 8 ký tự', async () => {
        const service = new PaymentsService({} as PrismaService);
        await expect(service.pay(userId, 'short', body))
            .rejects.toThrow(BadRequestException);
    });
});
