import { createHmac } from 'node:crypto';
import { ZalopayService, isValidZalopayQr } from './zalopay.service';

const service = new ZalopayService();
const originalFetch = global.fetch;

beforeEach(() => {
    process.env.ZALOPAY_APP_ID = '12345';
    process.env.ZALOPAY_KEY1 = 'test-integration-key-1';
    process.env.ZALOPAY_KEY2 = 'test-integration-key-2';
    process.env.ZALOPAY_CALLBACK_URL = 'https://brewlite.example/payments/zalopay/callback';
    process.env.FRONTEND_URL = 'https://brewlite-web.example';
});
afterEach(() => { global.fetch = originalFetch; });

describe('ZaloPay Sandbox v2 signing', () => {
    it('rejects placeholder keys before sending a payment request', () => {
        process.env.ZALOPAY_KEY1 = 'PASTE_SANDBOX_KEY1_ON_BACKEND_ONLY';
        expect(() => service.assertConfigured()).toThrow();
    });

    it('rejects callback paths with a missing final character', () => {
        process.env.ZALOPAY_CALLBACK_URL = 'https://some-backend.onrender.com/payments/zalopay/callbac';
        expect(() => service.assertConfigured()).toThrow();
    });

    it('creates transaction date prefix using Vietnam timezone, not Render UTC', () => {
        expect(service.createTransactionId('abc123456789', new Date('2026-11-12T17:30:00Z')))
            .toBe('261113_abc123456789');
    });

    it('uses Key1 to sign the seven request fields in exact order', async () => {
        const fetchMock = jest.fn(async (_url: any, options: any) => {
            const body = JSON.parse(options.body);
            const expected = createHmac('sha256', 'test-integration-key-1').update([
                body.app_id, body.app_trans_id, body.app_user, body.amount, body.app_time,
                body.embed_data, body.item,
            ].join('|')).digest('hex');
            expect(body.mac).toBe(expected);
            expect(body.embed_data).toContain('payment-result');
            return { ok: true, json: async () => ({ return_code: 1,
                    order_url: 'https://sbgateway.zalopay.vn/openinapp?order=test' }) };
        });
        global.fetch = fetchMock as any;
        const orderUrl = await service.createOrder({
            appTransId: '261112_abc123456789', userId: 'test-user-123', amount: 90000,
            orderId: 'order-123', expiresAt: new Date(Date.now() + 15 * 60_000),
        });
        expect(orderUrl.paymentUrl).toContain('sbgateway.zalopay.vn');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not throw raw TypeError when ZaloPay returns malformed order_url after success', async () => {
        global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({
                return_code: 1, sub_return_code: 1, order_url: 'not-a-valid-url',
            }) })) as any;
        await expect(service.createOrder({
            appTransId: '261112_abc123456789', userId: 'test-user-123', amount: 90000,
            orderId: 'order-123', expiresAt: new Date(Date.now() + 15 * 60_000),
        })).rejects.toThrow('Giao dịch cần đối soát');
    });

    it('rejects external payment URLs even when return_code is 1', async () => {
        global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({
                return_code: 1, order_url: 'https://example.com/pay',
            }) })) as any;
        await expect(service.createOrder({
            appTransId: '261112_abc123456789', userId: 'test-user-123', amount: 90000,
            orderId: 'order-123', expiresAt: new Date(Date.now() + 15 * 60_000),
        })).rejects.toThrow('địa chỉ thanh toán không được phép');
    });

    it('rejects tampered callback and accepts exact signed data using Key2', () => {
        const data = JSON.stringify({ app_id: 12345, app_trans_id: '261112_abc123456789',
            amount: 90000, zp_trans_id: 261112000000112 });
        const mac = createHmac('sha256', 'test-integration-key-2').update(data).digest('hex');
        expect(service.verifyCallback({ data, mac, type: 1 })?.amount).toBe(90000);
        expect(service.verifyCallback({ data: data.replace('90000', '1'), mac, type: 1 })).toBeNull();
    });

    it('signs query API with app_id|app_trans_id|key1', async () => {
        global.fetch = jest.fn(async (_url: any, options: any) => {
            const body = JSON.parse(options.body);
            expect(body.mac).toBe(createHmac('sha256', 'test-integration-key-1')
                .update('12345|261112_abc123456789|test-integration-key-1').digest('hex'));
            return { ok: true, json: async () => ({ return_code: 3, is_processing: true }) };
        }) as any;
        const result = await service.queryOrder('261112_abc123456789');
        expect(result.returnCode).toBe(3);
    });
});

// Phản hồi ZaloPay v2 chuẩn vẫn là URL HTTPS. Chỉ khôi phục thêm một lớp
// mã hóa khi URL cuối cùng thuộc miền ZaloPay; KHÔNG tự dựng URL từ token.
// Build a test QR with a real EMV CRC; synthetic strings must not be accepted.
function withQrCrc(prefix: string) {
    const body = prefix + '6304';
    let crc = 0xFFFF;
    for (const ch of body) {
        crc ^= ch.charCodeAt(0) << 8;
        for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
    return body + crc.toString(16).toUpperCase().padStart(4, '0');
}

describe('ZaloPay checkout URL validation', () => {
    const valid = 'https://sbgateway.zalopay.vn/openinapp?order=SANDBOX_TEST_TOKEN';
    const create = () => service.createOrder({
        appTransId: '261113_abc123456789', userId: 'test-user-123', amount: 40000,
        orderId: 'order-test', expiresAt: new Date(Date.now() + 15 * 60_000),
    });
    const gateway = (orderUrl: unknown) => {
        global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({
                return_code: 1, sub_return_code: 1, order_url: orderUrl,
                order_token: 'TOKEN_REDACTED', zp_trans_token: 'TOKEN_REDACTED',
            }) })) as any;
    };

    it('accepts the official absolute HTTPS URL format', async () => {
        gateway(valid);
        expect((await create()).paymentUrl).toBe(valid);
    });

    it('supports one layer of percent encoding', async () => {
        gateway(encodeURIComponent(valid));
        expect((await create()).paymentUrl).toBe(valid);
    });

    it('supports a double-encoded JSON string', async () => {
        gateway(JSON.stringify(valid));
        expect((await create()).paymentUrl).toBe(valid);
    });

    it('supports one extra layer of escaped slashes', async () => {
        gateway(valid.replace(/\//g, '\\/'));
        expect((await create()).paymentUrl).toBe(valid);
    });

    it('accepts a gateway domain missing https scheme, without using tokens', async () => {
        gateway('sbgateway.zalopay.vn/openinapp?order=SANDBOX_TEST_TOKEN');
        expect((await create()).paymentUrl).toBe('https://sbgateway.zalopay.vn/openinapp?order=SANDBOX_TEST_TOKEN');
    });

    it('accepts a protocol-relative URL on a known ZaloPay gateway only', async () => {
        gateway('//qcgateway.zalopay.vn/openinapp?order=SANDBOX_TEST_TOKEN');
        expect((await create()).paymentUrl).toBe('https://qcgateway.zalopay.vn/openinapp?order=SANDBOX_TEST_TOKEN');
    });

    it('accepts exactly two URL encoding layers with official gateway', async () => {
        gateway(encodeURIComponent(encodeURIComponent(valid)));
        expect((await create()).paymentUrl).toBe(valid);
    });

    it('accepts a zero-width prefix only when the resulting URL is trusted', async () => {
        gateway('\u200B' + valid);
        expect((await create()).paymentUrl).toBe(valid);
    });

    it.each([
        ['ZWNJ', '‌'], ['ZWJ', '‍'], ['WORD JOINER', '⁠'],
        ['LRM', '‎'], ['RLM', '‏'], ['BOM', '﻿'], ['NBSP', ' '],
        ['LRE', '‪'], ['NUL', '\u0000'],
    ])('strips a %s invisible character from both ends of a trusted URL', async (_name, ch) => {
        gateway(ch + valid + ch);
        expect((await create()).paymentUrl).toBe(valid);
    });

    it('strips several mixed invisible characters before a JSON-quoted URL', async () => {
        gateway('​⁠' + JSON.stringify(valid));
        expect((await create()).paymentUrl).toBe(valid);
    });

    it('still rejects an external host hidden behind invisible characters', async () => {
        gateway('‌⁠https://attacker.example/pay?order=abc');
        await expect(create()).rejects.toThrow('địa chỉ thanh toán không được phép');
    });

    it('does not remove invisible characters from the middle of the URL', async () => {
        gateway('https://sbgateway.zalopay.vn/open​inapp?order=abc');
        const url = (await create()).paymentUrl || '';
        expect(url).not.toContain('​');
        expect(url).toContain('%E2%80%8B');
    });

    it('rejects a scheme-less hostile host, even when it contains zalopay.vn', async () => {
        gateway('qcgateway.zalopay.vn.attacker.example/openinapp?order=abc');
        await expect(create()).rejects.toThrow('URL thanh toán sai định dạng');
    });

    it('rejects a protocol-relative external host', async () => {
        gateway('//example.org/openinapp?order=abc');
        await expect(create()).rejects.toThrow('URL thanh toán sai định dạng');
    });

    it('rejects a percent-encoded external URL', async () => {
        gateway(encodeURIComponent('https://attacker.example/pay?order=abc'));
        await expect(create()).rejects.toThrow('địa chỉ thanh toán không được phép');
    });

    it('rejects a URL that has credentials embedded', async () => {
        gateway('https://user:pass@sbgateway.zalopay.vn/openinapp?order=abc');
        await expect(create()).rejects.toThrow('địa chỉ thanh toán không được phép');
    });

    it('does not create a URL from a gateway token', async () => {
        gateway('SANDBOX_TEST_TOKEN');
        await expect(create()).rejects.toThrow('URL thanh toán sai định dạng');
    });

    it('detects when order_url contains the QR payload instead of a payment URL', async () => {
        // Giống mẫu EMVCo 000201...6304XXXX trong phản hồi ZaloPay.
        const qr = withQrCrc('00020101021226520010vn.zalopay5204739953037045405690005802VN');
        global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({
            return_code: 1, sub_return_code: 1, order_url: qr, qr_code: qr,
            order_token: 'TOKEN_REDACTED', zp_trans_token: 'TOKEN_REDACTED',
        }) })) as any;
        expect(await create()).toEqual({paymentUrl: null, qrCode: qr});
    });

    it('detects a QR-shaped order_url even if qr_code is different', async () => {
        const qr = withQrCrc('00020101021226520010vn.zalopay5204739953037045405690005802VN');
        global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({
            return_code: 1, sub_return_code: 1, order_url: qr, qr_code: 'DIFFERENT_QR',
        }) })) as any;
        expect(await create()).toEqual({paymentUrl: null, qrCode: qr});
    });

    it('still accepts official order_url when a separate qr_code exists', async () => {
        global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({
            return_code: 1, sub_return_code: 1, order_url: valid,
            qr_code: withQrCrc('00020101021226520010vn.zalopay5204739953037045405690005802VN'),
        }) })) as any;
        const checkout = await create();
        expect(checkout.paymentUrl).toBe(valid);
        expect(isValidZalopayQr(checkout.qrCode)).toBe(true);
    });

    it('does not accept a forged QR with an incorrect CRC', async () => {
        const real = withQrCrc('00020101021226520010vn.zalopay5204739953037045405690005802VN');
        gateway(real.slice(0, -4) + '0000');
        await expect(create()).rejects.toThrow('mã QR không hợp lệ');
    });
});
