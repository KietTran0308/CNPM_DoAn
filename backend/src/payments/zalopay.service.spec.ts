import { createHmac } from 'node:crypto';
import { ZalopayService } from './zalopay.service';

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
    expect(orderUrl).toContain('sbgateway.zalopay.vn');
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
