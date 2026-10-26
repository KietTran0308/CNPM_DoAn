# BrewLite — Frontend Next.js (không Vite)

Giữ nguyên App Router, các component/hook, Zustand và React Query hiện có.

## Khởi chạy

1. Khởi động PostgreSQL và NestJS trước (xem README của backend).
2. Đặt `.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_USE_MOCK_API=false
```

3. Trong thư mục frontend:

```bash
npm ci
npm run dev
```

4. Mở `http://localhost:3000`. Trình duyệt gọi trực tiếp REST API port 4000.

## Luồng thử nghiệm

- `GET /products` tải menu thật từ DB; chọn một món sẽ tải size/topping qua `GET /products/:id/options`.
- Đăng ký/đăng nhập -> JWT -> giỏ hàng -> `POST /orders` (PENDING) -> `POST /payments` (PAID hoặc PAYMENT_FAILED) -> xem xác nhận/lịch sử.
- Xem profile, sửa profile, đổi mật khẩu; tích/đổi điểm và voucher lưu trong DB.
- Mỗi lần thanh toán gửi `Idempotency-Key`; Backend là nguồn giá và trạng thái chính thức.
- Nếu bật `NEXT_PUBLIC_USE_MOCK_API=true` chỉ để demo UI, **không ghi vào PostgreSQL**.

Kiểm tra: `npm run typecheck`, `npm run build`.

## Giới hạn
- Thanh toán ví và thẻ chỉ được mô phỏng, không kết nối ngân hàng thật.
- Trạng thái đơn pha chế do STAFF/ADMIN cập nhật; khách chỉ được hủy đơn chưa thanh toán.
- Khi mở từ thiết bị khác localhost, cần đổi `NEXT_PUBLIC_API_URL` sang hostname truy cập được và cấu hình `FRONTEND_URL` tương ứng cho CORS.
