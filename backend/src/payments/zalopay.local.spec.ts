import { ZalopayService } from './zalopay.service';

const original = {
    local: process.env.ZALOPAY_LOCAL_MODE,
    callback: process.env.ZALOPAY_CALLBACK_URL,
    appId: process.env.ZALOPAY_APP_ID,
    key1: process.env.ZALOPAY_KEY1,
    key2: process.env.ZALOPAY_KEY2,
    frontend: process.env.FRONTEND_URL,
};

beforeEach(() => {
    process.env.ZALOPAY_APP_ID = '12345';
    process.env.ZALOPAY_KEY1 = 'sandbox-test-key1';
    process.env.ZALOPAY_KEY2 = 'sandbox-test-key2';
    process.env.ZALOPAY_LOCAL_MODE = 'true';
    process.env.FRONTEND_URL = 'http://localhost:3100';
    delete process.env.ZALOPAY_CALLBACK_URL;
});
afterAll(() => {
    for (const [k, v] of Object.entries({
        ZALOPAY_LOCAL_MODE: original.local, ZALOPAY_CALLBACK_URL: original.callback,
        ZALOPAY_APP_ID: original.appId, ZALOPAY_KEY1: original.key1,
        ZALOPAY_KEY2: original.key2, FRONTEND_URL: original.frontend,
    })) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
});

describe('Docker local ZaloPay config', () => {
    it('allows no public callback only in local mode', () => {
        expect(() => new ZalopayService().assertConfigured()).not.toThrow();
        delete process.env.ZALOPAY_LOCAL_MODE;
        expect(() => new ZalopayService().assertConfigured()).toThrow(/callback/i);
    });
    it('refuses to point a local callback at the Render database', () => {
        process.env.ZALOPAY_CALLBACK_URL = 'https://shop-backend.onrender.com/payments/zalopay/callback';
        expect(() => new ZalopayService().assertConfigured()).toThrow(/Render/);
    });
    it('omits callback_url from the local create payload', async () => {
        const originalFetch = global.fetch;
        const fetchMock = jest.fn(async (_url: any, init: any) => {
            expect(JSON.parse(init.body)).not.toHaveProperty('callback_url');
            return { ok: true, text: async () => JSON.stringify({ return_code: 2, sub_return_code: -53 }) };
        });
        global.fetch = fetchMock as any;
        try {
            await expect(new ZalopayService().createOrder({
                appTransId: '261113_test12345678', userId: 'user12345', amount: 25000,
                orderId: 'f73d207a-1432-490e-a22b-79736172256d',
                expiresAt: new Date(Date.now() + 12 * 60_000),
            })).rejects.toThrow();
            expect(fetchMock).toHaveBeenCalledTimes(1);
        } finally { global.fetch = originalFetch; }
    });
});
