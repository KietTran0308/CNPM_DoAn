# BrewLite

Website đặt đồ uống: **Next.js (Frontend) + NestJS/Prisma (Backend) + PostgreSQL**. Thanh toán thử nghiệm bằng **ZaloPay Sandbox**. Chức năng STAFF/ADMIN gọi API bằng Postman, không cần giao diện `/staff`.

## 1. Chạy Docker local

Yêu cầu: Docker Desktop.

1. Đặt thư mục `backend`, `frontend` cùng cấp với `docker-compose.yml`.
2. Sao chép `.env.example` thành `.env` ở thư mục gốc.
3. Thay `POSTGRES_PASSWORD`, `JWT_SECRET`, `ZALOPAY_APP_ID`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2` trong `.env` bằng thông số của bạn.
4. Chạy:

```bash
docker compose up --build -d
docker compose ps
```

- Website: http://localhost:3100
- Kiểm tra Backend: http://localhost:4100/health
- PostgreSQL (pgAdmin): `127.0.0.1:5433`, database theo `POSTGRES_DB`.
- Xem log: `docker compose logs -f backend`
- Dừng mà **giữ dữ liệu**: `docker compose down`

**ZaloPay local:** không cần `ZALOPAY_LOCAL_CALLBACK_URL` để tạo QR. Nếu callback không có, Backend chủ động QueryDR lúc khởi động và mỗi 2 phút khi đang chạy; mỗi lần chỉ xét số lượng giới hạn. Nếu có HTTPS tunnel trỏ tới `localhost:4100`, có thể đặt `ZALOPAY_LOCAL_CALLBACK_URL=https://TEN-TUNNEL/payments/zalopay/callback`. Tuyệt đối không đặt URL Backend Render vào callback local vì hai môi trường có database khác nhau.

**Truy cập bằng điện thoại:** `localhost` là của chính điện thoại, nên không dùng địa chỉ đó để gọi API Docker từ điện thoại. Cách dễ nhất là thử trên website Render. Nếu muốn truy cập Docker từ điện thoại, cần cấu hình một đường truy cập/tunnel tới cả Frontend lẫn Backend, đồng thời cập nhật `NEXT_PUBLIC_API_URL` và `LOCAL_FRONTEND_URL`, rồi build lại Frontend.

## 2. Triển khai Render

- Backend cần `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `ZALOPAY_APP_ID`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2`, `ZALOPAY_CALLBACK_URL` HTTPS trỏ về `/payments/zalopay/callback`.
- Frontend cần `NEXT_PUBLIC_API_URL` bằng URL HTTPS của Backend (đặt trước khi build).
- `ZALOPAY_LOCAL_MODE` **không bật** trên Render. `ZALOPAY_AUTO_RECONCILE=true` (mặc định) để tự truy vấn các giao dịch chưa có callback.
- Deploy **Backend trước, Frontend sau**. Không reset database đang có dữ liệu.

Backend tự kiểm tra giao dịch ZaloPay `PENDING` từ 1 phút sau khi tạo, tại thời điểm khởi động và mỗi 2 phút. Nếu gateway xác nhận `SUCCESS`, hệ thống cập nhật thanh toán và hoàn tất đơn. Nếu kết quả vẫn đang xử lý hoặc lỗi mạng, hệ thống tiếp tục giữ `PENDING`, không tự tạo giao dịch thứ hai. Khi gateway khẳng định giao dịch hết hạn/thất bại, tài nguyên đã giữ có thể được hoàn qua luồng hủy đơn hết hạn sẵn có.

**Lưu ý Render Free:** tác vụ định kỳ chỉ chạy khi Backend đang hoạt động. Khi Render ngủ, không có lần kiểm tra mới cho tới khi dịch vụ được đánh thức. Người dùng vẫn có nút **Tôi đã thanh toán – Kiểm tra kết quả** để xác minh ngay.

## 3. Kiểm tra API và dữ liệu

```http
GET /health
GET /products
GET /payments/zalopay/status?orderId=<UUID>     (Bearer token của chủ đơn)
POST /payments/zalopay/verify/<UUID>             (Bearer token của chủ đơn)
```

Không coi việc **đã hiện QR** hoặc **ứng dụng Sandbox hiển thị thành công** là chứng cứ đủ để đánh dấu `PAID`: chỉ Backend xác minh callback HMAC hoặc QueryDR. `payment=SUCCESS` nhưng `order=PENDING` là trường hợp cần đối soát, tuyệt đối không thanh toán lại ngay.

## 4. Database và bảo mật

- SQL đầy đủ `backend/prisma/dbBrewLite.sql` dùng **duy nhất cho database mới/trống**. PostgreSQL Render hiện có dữ liệu thì không chạy lại SQL này.
- Không commit, gửi ZIP hoặc đăng tải `.env` có mật khẩu/khóa ZaloPay; `.env.example` chỉ chứa placeholder.
- Chưa tích hợp hoàn tiền ZaloPay thật trong Sandbox. Đơn đã nhận tiền không tự động bị hủy/hoàn tiền giả.
