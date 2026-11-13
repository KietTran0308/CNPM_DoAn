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

// Ký tự định dạng (Cf), điều khiển (Cc) và khoảng trắng Unicode (Z) ở hai đầu chuỗi.
const INVISIBLE_EDGE = /^[\p{Cf}\p{Cc}\p{Z}]+|[\p{Cf}\p{Cc}\p{Z}]+$/gu;
const codePointLabel = (char: string) =>
    'U+' + (char.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0');

export type ZalopayCheckout = { paymentUrl: string | null; qrCode: string | null };

// EMVCo QR Code: validate payload prefix, ZaloPay marker and CRC-16/CCITT-FALSE.
// Never construct a checkout URL from qr_code/order_token/zp_trans_token.
export function isValidZalopayQr(value: unknown): value is string {
    if (typeof value !== 'string' || value.length < 40 || value.length > 2048 ||
        !/^000201/.test(value) || !/vn\.zalopay/i.test(value) ||
        !/6304[0-9A-F]{4}$/i.test(value) || /[^\x20-\x7E]/.test(value)) return false;
    let crc = 0xFFFF;
    for (let index = 0; index < value.length - 4; index++) {
        crc ^= value.charCodeAt(index) << 8;
        for (let bit = 0; bit < 8; bit++) {
            crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0') === value.slice(-4).toUpperCase();
}

// ZaloPay zp_trans_id là số nguyên 64-bit: JSON.parse sẽ làm tròn nếu > Number.MAX_SAFE_INTEGER.
// Giữ nguyên chuỗi chữ số từ JSON trước khi parse. HMAC callback vẫn kiểm tra trên RAW data.
export function parseZalopayJsonPreservingId(raw: string): unknown {
    const safe = raw.replace(/("zp_trans_id"\s*:\s*)([0-9]{1,20})(?=\s*[,}])/g, '$1"$2"');
    return JSON.parse(safe);
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
        // callback_url không bắt buộc trong API tạo đơn ZaloPay.
        // Local Docker không có HTTPS public vẫn tạo đơn và dùng QueryDR tự động.
        // Render bắt buộc callback HTTPS; không gửi callback sang DB môi trường khác.
        const localMode = process.env.ZALOPAY_LOCAL_MODE === 'true';
        if (!callbackUrl && !localMode) {
            throw new InternalServerErrorException('Render cần ZALOPAY_CALLBACK_URL HTTPS hợp lệ');
        }
        if (callbackUrl) {
            let callback: URL;
            try { callback = new URL(callbackUrl); }
            catch { throw new InternalServerErrorException('ZALOPAY_CALLBACK_URL phải là URL HTTPS hợp lệ'); }
            if (callback.protocol !== 'https:' || callback.pathname !== '/payments/zalopay/callback' ||
                callback.search || callback.hash || callback.username || callback.password ||
                /^(?:replace|your)[-.]/i.test(callback.hostname)) {
                throw new InternalServerErrorException('ZALOPAY_CALLBACK_URL phải trỏ chính xác về HTTPS /payments/zalopay/callback');
            }
            if (localMode && callback.hostname.endsWith('.onrender.com')) {
                throw new InternalServerErrorException('Docker local không được gửi callback về Backend Render (khác database)');
            }
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
        // Đọc text để không làm tròn zp_trans_id 64-bit của QueryDR.
        const json = await (async () => {
            try {
                return typeof response.text === 'function'
                    ? parseZalopayJsonPreservingId(await response.text())
                    : await response.json(); // Fallback cho các response giả lập trong unit test.
            } catch { return null; }
        })();
        if (!json || typeof json !== 'object' || Array.isArray(json)) {
            throw new ServiceUnavailableException('ZaloPay trả phản hồi không hợp lệ');
        }
        return json as Record<string, unknown>;
    }

    /**
     * ZaloPay v2 trả order_url là URL HTTPS. Chỉ chuẩn hóa những dạng
     * bao gói URL có thể xác định rõ, rồi kiểm tra HTTPS + hostname bên dưới.
     * Không bao giờ tạo URL từ order_token, zp_trans_token hoặc qr_code.
     */
    private decodeOrderUrl(raw: string): { value: string; format: string } {
        let value = raw.trim();

        const cleanIdx = value.indexOf('https://sbgateway.zalopay.vn');
        if (cleanIdx > 0) {
            value = value.substring(cleanIdx);
        } else {
            const gatewayIdx = value.indexOf('sbgateway.zalopay.vn');
            if (gatewayIdx > 0 && gatewayIdx < 10) {
                value = 'https://' + value.substring(gatewayIdx);
            }
        }

        const stripped = value.replace(INVISIBLE_EDGE, '');
        const hadInvisibleEdge = stripped !== value;
        value = stripped;

        if (/^https:\/\//i.test(value)) {
            return { value, format: hadInvisibleEdge ? 'invisible-prefix-https' : 'absolute-https' };
        }

        // Một lớp JSON string bao ngoài URL, ví dụ: '"https://..."'.
        if (value.startsWith('"') && value.endsWith('"')) {
            try {
                const parsed: unknown = JSON.parse(value);
                if (typeof parsed === 'string' && /^https:\/\//i.test(parsed)) {
                    return { value: parsed, format: 'json-quoted-https' };
                }
            } catch { /* Giữ nguyên để chẩn đoán. */ }
        }

        // URL trả về có dấu gạch chéo escaped (không giải mã token/query).
        if (/^https:/i.test(value) && value.includes('\\/')) {
            const unescaped = value.replaceAll('\\/', '/');
            if (/^https:\/\//i.test(unescaped)) {
                return { value: unescaped, format: 'escaped-https' };
            }
        }

        // Không thể tự đoán hostname. Nếu thiếu scheme, chỉ khôi phục cho
        // hai gateway được mô tả trong tài liệu ZaloPay, không cho host tùy ý.
        const knownGateway = /^(?:sbgateway|qcgateway)\.zalopay\.vn(?:[/?#:]|$)/i;
        if (knownGateway.test(value)) {
            return { value: 'https://' + value, format: 'gateway-without-scheme' };
        }
        if (value.startsWith('//') && knownGateway.test(value.slice(2))) {
            return { value: 'https:' + value, format: 'protocol-relative-gateway' };
        }

        // Chỉ tối đa hai lần giải mã URI, không giải mã payload/token riêng lẻ.
        // Hỗ trợ https%3A%2F%2F... và https%253A%252F%252F...
        if (/^https%(?:3a|253a)/i.test(value)) {
            let candidate = value;
            for (let count = 1; count <= 2; count++) {
                try { candidate = decodeURIComponent(candidate); }
                catch { break; }
                if (/^https:\/\//i.test(candidate)) {
                    return { value: candidate, format: count === 1 ? 'percent-encoded-https' : 'double-percent-encoded-https' };
                }
            }
        }

        return { value, format: /^http:\/\//i.test(value) ? 'http-not-https'
                : /^[a-z][a-z0-9+.-]*:/i.test(value) ? 'other-scheme'
                    : value.startsWith('//') ? 'protocol-relative-unknown'
                        : value.startsWith('{') || value.startsWith('[') ? 'json-object-like'
                            : /^https%/i.test(value) ? 'encoded-https-unknown'
                                : /^[A-Za-z0-9_+\/=-]+$/.test(value) ? 'token-like'
                                    : value.startsWith('<') ? 'html-like' : 'unknown' };
    }

    /**
     * Không ghi nguyên link, token, query hoặc thông tin thanh toán lên Render.
     * Định dạng các ký tự đầu được rút về nhóm chữ/số/dấu câu để tra lỗi.
     */
    private safeOrderUrlDiagnostics(value: string) {
        const prefixShape = Array.from(value.slice(0, 20)).map(char => {
            if (/^[a-z]$/i.test(char)) return 'A';
            if (/^[0-9]$/.test(char)) return '9';
            if (char === ':') return ':';
            if (char === '/') return '/';
            if (char === '.') return '.';
            if (char === '?') return '?';
            if (char === '=') return '=';
            if (char === '%') return '%';
            if (char === '\\') return '\\';
            return '_';
        }).join('');
        return {
            prefixShape,
            containsKnownGateway: /(?:sbgateway|qcgateway)\.zalopay\.vn/i.test(value),
            containsHttpsScheme: /https:\/\//i.test(value),
            containsEncodedHttps: /https%(?:3a|253a)/i.test(value),
            startsWithInvisibleChar: /^[\p{Cf}\p{Cc}\p{Z}]/u.test(value),
            // M\u00E3 Unicode c\u1EE7a 3 k\u00FD t\u1EF1 \u0111\u1EA7u/cu\u1ED1i: kh\u00F4ng l\u1ED9 token nh\u01B0ng ch\u1EC9 ra ngay k\u00FD t\u1EF1 l\u1EA1.
            leadingCodePoints: Array.from(value).slice(0, 3).map(codePointLabel),
            trailingCodePoints: Array.from(value).slice(-3).map(codePointLabel),
            hasWhitespace: /\s/.test(value),
        };
    }

    async createOrder(input: {
        appTransId: string; userId: string; amount: number; orderId: string; expiresAt: Date;
    }): Promise<ZalopayCheckout> {
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
            // Chỉ gửi callback_url khi đã cấu hình HTTPS công khai cho đúng backend.
            ...(cfg.callbackUrl ? { callback_url: cfg.callbackUrl } : {}),
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
        // return_code=1 means "order created", NOT "payment received".
        // ZaloPay exposes both a gateway URL and an EMV QR field; a few sandbox
        // responses put the QR payload into order_url. Treat that as a QR, not a URL.
        const rawOrderUrl = typeof result.order_url === 'string' ? result.order_url.trim() : '';
        const rawQr = typeof result.qr_code === 'string' ? result.qr_code.trim() : '';
        const qrCode = isValidZalopayQr(rawQr) ? rawQr :
            isValidZalopayQr(rawOrderUrl) ? rawOrderUrl : null;
        const isQrOrderUrl = isValidZalopayQr(rawOrderUrl);
        const decoded = this.decodeOrderUrl(rawOrderUrl);
        let paymentUrl: string | null = null;
        const diagnostics = {
            returnCode: result.return_code,
            subReturnCode: result.sub_return_code ?? null,
            urlType: typeof result.order_url,
            urlLength: rawOrderUrl.length,
            urlFormat: decoded.format,
            ...this.safeOrderUrlDiagnostics(rawOrderUrl),
            hasQrCode: rawQr.length > 0,
            orderUrlEqualsQrCode: Boolean(rawQr && rawQr === rawOrderUrl),
            orderUrlLooksLikeEmvQr: isQrOrderUrl,
            qrValidated: Boolean(qrCode),
        };
        if (rawOrderUrl && !isQrOrderUrl) {
            let url: URL | null = null;
            try { url = new URL(decoded.value); } catch { /* can still use valid QR */ }
            if (url) {
                // Deny unknown hosts; never forward untrusted URLs to users.
                if (url.protocol !== 'https:' ||
                    !(url.hostname === 'zalopay.vn' || url.hostname.endsWith('.zalopay.vn')) ||
                    Boolean(url.username || url.password) || (url.port !== '' && url.port !== '443')) {
                    if (!qrCode) {
                        this.logger.warn(JSON.stringify({ event: 'ZALOPAY_CREATE_UNTRUSTED_ORDER_URL',
                            ...diagnostics, hostname: url.hostname, protocol: url.protocol }));
                        throw new ServiceUnavailableException(
                            'ZaloPay trả địa chỉ thanh toán không được phép. Giao dịch cần đối soát; không tạo lại ngay.',
                        );
                    }
                } else {
                    paymentUrl = url.toString();
                }
            }
        }
        if (!paymentUrl && !qrCode) {
            this.logger.warn(JSON.stringify({ event: 'ZALOPAY_CREATE_INVALID_CHECKOUT', ...diagnostics }));
            throw new ServiceUnavailableException(
                'ZaloPay trả URL thanh toán sai định dạng hoặc mã QR không hợp lệ. Giao dịch cần đối soát; không tạo lại ngay.',
            );
        }
        if (qrCode && !paymentUrl) {
            this.logger.log(JSON.stringify({ event: 'ZALOPAY_CREATE_QR_CHECKOUT',
                appTransIdLength: input.appTransId.length, qrLength: qrCode.length,
                orderUrlEqualsQrCode: diagnostics.orderUrlEqualsQrCode }));
        }
        return { paymentUrl, qrCode };
    }

    verifyCallback(body: ZaloCallback): ZaloCallbackData | null {
        const cfg = this.config();
        if (!body || typeof body.data !== 'string' || typeof body.mac !== 'string' ||
            !/^[a-fA-F0-9]{64}$/.test(body.mac) || (body.type !== undefined && body.type !== 1)) return null;
        const expected = Buffer.from(this.mac(body.data, cfg.key2), 'hex');
        if (!timingSafeEqual(expected, Buffer.from(body.mac, 'hex'))) return null;
        let payload: unknown;
        try { payload = parseZalopayJsonPreservingId(body.data); } catch { return null; }
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
