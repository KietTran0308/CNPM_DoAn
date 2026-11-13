import { Injectable, InternalServerErrorException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

// Các mã này xác nhận ZaloPay từ chối TẠO đơn do dữ liệu/cấu hình không hợp lệ.
// Tuyệt đối không dùng cho timeout, lỗi HTTP, -68 (trùng app_trans_id) hay lỗi hệ thống.
export class ZalopayCreationRejectedError extends Error {
    constructor(public readonly subReturnCode: number) {
        super(`ZaloPay từ chối tạo đơn (mã ${subReturnCode})`);
        this.name = 'ZalopayCreationRejectedError';
    }
}

export type ZaloCallback = { data: string; mac: string; type?: number };
export type ZaloCallbackData = {
    app_id: number; app_trans_id: string; amount: number; zp_trans_id: number | string;
    server_time?: number;
};

@Injectable()
export class ZalopayService {
    private readonly logger = new Logger(ZalopayService.name);

    private config() {
        const appId = Number(process.env.ZALOPAY_APP_ID);
        const key1 = process.env.ZALOPAY_KEY1?.trim() || '';
        const key2 = process.env.ZALOPAY_KEY2?.trim() || '';
        const callbackUrl = process.env.ZALOPAY_CALLBACK_URL?.trim() || '';
        const createUrl = process.env.ZALOPAY_CREATE_URL || 'https://sb-openapi.zalopay.vn/v2/create';
        const queryUrl = process.env.ZALOPAY_QUERY_URL || 'https://sb-openapi.zalopay.vn/v2/query';
        if (!Number.isSafeInteger(appId) || appId <= 0 || !key1 || !key2 ||
            (/YOUR_|PASTE_|REPLACE_|CHANGE_ME/i.test(key1) || /YOUR_|PASTE_|REPLACE_|CHANGE_ME/i.test(key2))) {
            throw new InternalServerErrorException('Cần ZALOPAY_APP_ID, ZALOPAY_KEY1, ZALOPAY_KEY2 do ZaloPay Sandbox cấp');
        }
        let callback: URL;
        try { callback = new URL(callbackUrl); }
        catch { throw new InternalServerErrorException('ZALOPAY_CALLBACK_URL phải là URL HTTPS hợp lệ'); }
        if (callback.protocol !== 'https:' || callback.pathname !== '/payments/zalopay/callback' ||
            callback.search || callback.hash || callback.username || callback.password ||
            /^(?:replace|your)[-.]/i.test(callback.hostname)) {
            throw new InternalServerErrorException('ZALOPAY_CALLBACK_URL phải trỏ chính xác về HTTPS /payments/zalopay/callback');
        }
        // Local Docker có PostgreSQL riêng: không thể gửi callback về Render,
        // vì Render sẽ tìm giao dịch trong DATABASE KHÁC và không cập nhật được đơn local.
        if (process.env.ZALOPAY_LOCAL_MODE === 'true' && callback.hostname.endsWith('.onrender.com')) {
            throw new InternalServerErrorException(
                'Docker local đang trỏ ZALOPAY_CALLBACK_URL về Backend Render. ' +
                'Hãy dùng HTTPS tunnel chuyển tới localhost:4100/payments/zalopay/callback',
            );
        }
        // Tránh gửi Key1 đến domain không thuộc ZaloPay do cấu hình sai.
        for (const [url, path] of [[createUrl, '/v2/create'], [queryUrl, '/v2/query']]) {
            const parsed = new URL(url);
            if (parsed.protocol !== 'https:' || parsed.hostname !== 'sb-openapi.zalopay.vn' || parsed.pathname !== path ||
                parsed.search || parsed.hash) {
                throw new InternalServerErrorException('BrewLite chỉ cho phép endpoint ZaloPay Sandbox v2');
            }
        }
        return { appId, key1, key2, callbackUrl, createUrl, queryUrl };
    }

    assertConfigured() { this.config(); }
    appId() { return this.config().appId; }

    vietnamPrefix(date: Date = new Date()): string {
        const pieces = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Ho_Chi_Minh', year: '2-digit', month: '2-digit', day: '2-digit',
        }).formatToParts(date);
        const take = (name: string) => pieces.find(p => p.type === name)?.value || '';
        return `${take('year')}${take('month')}${take('day')}`;
    }

    createTransactionId(suffix: string, date: Date = new Date()) {
        if (!/^[a-zA-Z0-9]{8,32}$/.test(suffix)) {
            throw new InternalServerErrorException('Mã giao dịch ZaloPay không hợp lệ');
        }
        return `${this.vietnamPrefix(date)}_${suffix}`;
    }

    private mac(value: string, key: string) {
        return createHmac('sha256', key).update(value, 'utf8').digest('hex');
    }

    private async post(url: string, data: object): Promise<Record<string, unknown>> {
        let response: Response;
        try {
            response = await fetch(url, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(data), redirect: 'error', signal: AbortSignal.timeout(10000),
            });
        } catch {
            throw new ServiceUnavailableException('Không kết nối được ZaloPay; giữ nguyên giao dịch để đối soát');
        }
        if (!response.ok) throw new ServiceUnavailableException('ZaloPay trả lỗi HTTP; cần kiểm tra giao dịch');
        const json = await response.json().catch(() => null);
        if (!json || typeof json !== 'object' || Array.isArray(json)) {
            throw new ServiceUnavailableException('ZaloPay trả phản hồi không hợp lệ');
        }
        return json as Record<string, unknown>;
    }

    /**
     * Chỉ khôi phục MỘT lớp mã hóa của một URL HTTPS từ chính phản hồi ZaloPay.
     * Không tự tạo URL từ order_token / zp_trans_token (không có đặc tả bảo đảm).
     * URL sau khôi phục vẫn phải qua danh sách domain tin cậy ở createOrder().
     */
    private decodeOrderUrl(raw: string): { value: string; format: string } {
        const original = raw.trim();
        if (/^https:\/\//i.test(original)) return { value: original, format: 'absolute-https' };

        // Đôi khi bên trung gian JSON-encode thêm lần nữa: '"https://..."'.
        // Chỉ hỗ trợ giá trị JSON string trọn vẹn, không xử lý JSON/object tùy ý.
        if (original.startsWith('"') && original.endsWith('"')) {
            try {
                const decoded: unknown = JSON.parse(original);
                if (typeof decoded === 'string' && /^https:\/\//i.test(decoded)) {
                    return { value: decoded, format: 'json-quoted-https' };
                }
            } catch { /* Không phải chuỗi JSON hợp lệ. */ }
        }

        // Một số lớp trung gian có thể escape dấu / thêm lần nữa.
        if (original.startsWith('https:') && original.includes('\\/')) {
            const decoded = original.replaceAll('\\/', '/');
            if (/^https:\/\//i.test(decoded)) {
                return { value: decoded, format: 'escaped-https' };
            }
        }

        // Toàn bộ URL đôi khi bị URL-encode, ví dụ https%3A%2F%2F...
        if (/^https%3a%2f%2f/i.test(original)) {
            try {
                const decoded = decodeURIComponent(original);
                if (/^https:\/\//i.test(decoded)) {
                    return { value: decoded, format: 'percent-encoded-https' };
                }
            } catch { /* Dữ liệu phần trăm không hợp lệ. */ }
        }

        // Dấu hiệu hữu ích nhưng KHÔNG dùng để tự chế một liên kết thanh toán.
        const format = original.startsWith('http://') ? 'http-not-https'
            : original.startsWith('//') ? 'protocol-relative'
                : /^https?:\\\/\\\//i.test(original) ? 'escaped-slashes'
                    : /^[a-z][a-z0-9+.-]*:/i.test(original) ? 'other-scheme'
                        : /^[A-Za-z0-9_+\/=-]+$/.test(original) ? 'token-like'
                            : original.startsWith('<') ? 'html-like' : 'unknown';
        return { value: original, format };
    }

    async createOrder(input: {
        appTransId: string; userId: string; amount: number; orderId: string; expiresAt: Date;
    }): Promise<string> {
        const cfg = this.config();
        if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
            throw new InternalServerErrorException('ZaloPay chỉ nhận số tiền nguyên VND lớn hơn 0');
        }
        if (!/^\d{6}_[a-zA-Z0-9]{8,32}$/.test(input.appTransId)) {
            throw new InternalServerErrorException('app_trans_id ZaloPay sai định dạng');
        }
        const remaining = Math.floor((input.expiresAt.getTime() - Date.now()) / 1000);
        if (remaining < 300) {
            throw new ServiceUnavailableException('Đơn sắp hết hạn; không thể khởi tạo giao dịch ZaloPay mới');
        }
        const appTime = Date.now();
        const item = '[]';
        // Có thể đặt địa chỉ Frontend HTTPS công khai cho trường hợp thanh toán
        // trên điện thoại, không buộc CORS FRONTEND_URL dùng địa chỉ tunnel.
        const frontendUrl = (process.env.ZALOPAY_RETURN_ORIGIN ||
            (process.env.FRONTEND_URL || '').split(',')[0]).trim();
        if (!/^https:\/\//.test(frontendUrl) &&
            !/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(frontendUrl)) {
            throw new InternalServerErrorException(
                'ZALOPAY_RETURN_ORIGIN/FRONTEND_URL cần là HTTPS công khai hoặc localhost khi chạy trên PC',
            );
        }
        const redirectUrl = new URL('/payment-result', frontendUrl);
        redirectUrl.searchParams.set('orderId', input.orderId);
        const embedData = JSON.stringify({ redirecturl: redirectUrl.toString() });
        const payload = {
            app_id: cfg.appId, app_trans_id: input.appTransId,
            app_user: input.userId.slice(0, 50), amount: input.amount, app_time: appTime,
            expire_duration_seconds: Math.min(1200, remaining),
            item, embed_data: embedData, bank_code: '',
            callback_url: cfg.callbackUrl,
            description: `BrewLite - Thanh toan don ${input.orderId.slice(0, 8)}`,
            mac: '',
        };
        payload.mac = this.mac(
            [payload.app_id, payload.app_trans_id, payload.app_user, payload.amount,
                payload.app_time, payload.embed_data, payload.item].join('|'), cfg.key1,
        );
        const result = await this.post(cfg.createUrl, payload);
        if (result.return_code !== 1) {
            const returnCode = Number(result.return_code);
            const subCode = Number(result.sub_return_code);
            // Theo bảng mã lỗi ZaloPay: sai app_id, HMAC, dữ liệu/yêu cầu là lỗi tạo đơn
            // bị từ chối rõ ràng. Không đánh dấu FAILED đối với timeout, HTTP lỗi,
            // hệ thống lỗi hoặc mã trùng giao dịch -68 (phải Query trước).
            const rejectedCodes = new Set([-2, -53, -401, -402, -403, -405]);
            if (returnCode === 2 && rejectedCodes.has(subCode)) {
                throw new ZalopayCreationRejectedError(subCode);
            }
            throw new ServiceUnavailableException(
                `ZaloPay chưa xác nhận tạo giao dịch (return_code=${String(result.return_code ?? '?')}, ` +
                `sub_return_code=${String(result.sub_return_code ?? '?')}). Cần đối soát trước khi thử lại`,
            );
        }
        // return_code=1 chỉ nghĩa là cổng đã tạo đơn. Không được kết luận
        // thanh toán thành công khi thiếu/không đọc được order_url.
        const rawOrderUrl = result.order_url;
        const orderUrl = typeof rawOrderUrl === 'string' ? rawOrderUrl.trim() : '';
        const decoded = this.decodeOrderUrl(orderUrl);
        // Những thuộc tính sau không chứa link thanh toán, token hay khóa bí mật.
        const diagnostics = {
            returnCode: result.return_code,
            subReturnCode: result.sub_return_code ?? null,
            urlType: typeof rawOrderUrl,
            urlLength: orderUrl.length,
            urlFormat: decoded.format,
            hasOrderToken: typeof result.order_token === 'string' && result.order_token.length > 0,
            hasZpTransToken: typeof result.zp_trans_token === 'string' && result.zp_trans_token.length > 0,
            hasQrCode: typeof result.qr_code === 'string' && result.qr_code.length > 0,
        };
        if (!orderUrl) {
            this.logger.warn(JSON.stringify({ event: 'ZALOPAY_CREATE_MISSING_ORDER_URL', ...diagnostics }));
            throw new ServiceUnavailableException(
                'ZaloPay báo tạo đơn thành công nhưng thiếu đường dẫn thanh toán. Giao dịch cần đối soát; không tạo lại ngay.',
            );
        }
        let url: URL;
        try {
            url = new URL(decoded.value);
        } catch {
            this.logger.warn(JSON.stringify({ event: 'ZALOPAY_CREATE_INVALID_ORDER_URL', ...diagnostics }));
            throw new ServiceUnavailableException(
                'ZaloPay trả về URL thanh toán sai định dạng. Giao dịch cần đối soát; không tạo lại ngay.',
            );
        }
        // Chỉ cho phép HTTPS thuộc tên miền thật của ZaloPay. Không theo redirect,
        // không chấp nhận userinfo, HTTP hay host ngoài ZaloPay.
        if (url.protocol !== 'https:' ||
            !(url.hostname === 'zalopay.vn' || url.hostname.endsWith('.zalopay.vn')) ||
            Boolean(url.username || url.password) || (url.port !== '' && url.port !== '443')) {
            this.logger.warn(JSON.stringify({
                event: 'ZALOPAY_CREATE_UNTRUSTED_ORDER_URL', ...diagnostics,
                hostname: url.hostname, protocol: url.protocol,
            }));
            throw new ServiceUnavailableException(
                'ZaloPay trả về địa chỉ thanh toán không được phép. Giao dịch cần đối soát; không tạo lại ngay.',
            );
        }
        if (decoded.format !== 'absolute-https') {
            this.logger.log(JSON.stringify({
                event: 'ZALOPAY_CREATE_URL_NORMALIZED', format: decoded.format, hostname: url.hostname,
            }));
        }
        return url.toString();
    }

    verifyCallback(body: ZaloCallback): ZaloCallbackData | null {
        const cfg = this.config();
        if (!body || typeof body.data !== 'string' || typeof body.mac !== 'string' ||
            !/^[a-fA-F0-9]{64}$/.test(body.mac) || (body.type !== undefined && body.type !== 1)) return null;
        const expected = Buffer.from(this.mac(body.data, cfg.key2), 'hex');
        if (!timingSafeEqual(expected, Buffer.from(body.mac, 'hex'))) return null;
        let payload: unknown;
        try { payload = JSON.parse(body.data); } catch { return null; }
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
        const data = payload as Partial<ZaloCallbackData>;
        if (data.app_id !== cfg.appId || typeof data.app_trans_id !== 'string' ||
            !/^\d{6}_[a-zA-Z0-9]{8,32}$/.test(data.app_trans_id) ||
            !Number.isSafeInteger(data.amount) || Number(data.amount) <= 0 ||
            !/^[0-9]{1,20}$/.test(String(data.zp_trans_id ?? '')) ||
            (typeof data.zp_trans_id === 'number' && !Number.isSafeInteger(data.zp_trans_id)) ||
            BigInt(String(data.zp_trans_id)) <= 0n) return null;
        return data as ZaloCallbackData;
    }

    async queryOrder(appTransId: string) {
        const cfg = this.config();
        if (!/^\d{6}_[a-zA-Z0-9]{8,32}$/.test(appTransId)) {
            throw new InternalServerErrorException('Mã giao dịch đối soát không hợp lệ');
        }
        const input = `${cfg.appId}|${appTransId}|${cfg.key1}`;
        const result = await this.post(cfg.queryUrl, {
            app_id: cfg.appId, app_trans_id: appTransId, mac: this.mac(input, cfg.key1),
        });
        if (![1, 2, 3].includes(Number(result.return_code))) {
            throw new ServiceUnavailableException('Không xác định được trạng thái giao dịch ZaloPay');
        }
        return {
            returnCode: Number(result.return_code),
            message: typeof result.return_message === 'string' ? result.return_message : '',
            subReturnCode: Number.isInteger(Number(result.sub_return_code)) ? Number(result.sub_return_code) : null,
            subReturnMessage: typeof result.sub_return_message === 'string' ? result.sub_return_message : '',
            amount: result.amount,
            zpTransId: result.zp_trans_id === undefined ? null : String(result.zp_trans_id),
            isProcessing: result.is_processing === true,
        };
    }
}
