# Các API BrewLite (gốc http://localhost:4000)

| HTTP | Endpoint | Đăng nhập | Mục đích |
|---|---|---|---|
| GET | /health | Không | Kiểm tra backend |
| GET | /products | Không | Lấy menu 32 sản phẩm |
| GET | /products/:id | Không | Chi tiết món |
| POST | /auth/register | Không | Đăng ký (fullName, email, password) |
| POST | /auth/login | Không | Đăng nhập, nhận {token, user} |
| GET | /auth/me | Có | Thông tin người dùng |
| POST | /orders | Có | Đặt giỏ hàng, tạo PENDING |
| GET | /orders/me | Có | Lịch sử đơn |
| POST | /orders/:id/cancel | Có (chủ đơn) | Hủy PENDING / PAYMENT_FAILED, hoàn kho |
| PATCH | /orders/:id/status | Có (STAFF/ADMIN) | Chuyển pha chế hợp lệ |
| POST | /payments | Có | Thanh toán idempotent, có mock failure |

## Ví dụ tạo đơn

Header: `Authorization: Bearer <JWT>`

```json
{
  "items": [
    { "productId": "vn-2", "size": "M", "toppings": ["Trân châu"], "qty": 2 }
  ],
  "voucherCode": "BANMOI15"
}
```

Backend kiểm tra tồn kho, voucher rồi **tự tính** subtotal/discount/total. Đừng gửi giá từ frontend để tránh gian lận.

## Ví dụ thanh toán

Headers: `Authorization: Bearer <JWT>` và `Idempotency-Key: pay-2026-unique-123456`

```json
{ "orderId": "<uuid từ POST /orders>", "method": "WALLET", "simulateFailure": false }
```

Cùng key và cùng yêu cầu: trả lại payment trước đó với `replay: true`. Key cũ với đơn khác: HTTP 409. Khi chọn `simulateFailure: true`, tạo trạng thái PAYMENT_FAILED và khách có thể thử lại bằng key mới. Phần này chỉ mô phỏng, không gọi ví điện tử/thẻ thật.

## Các tiêu chí Task 10

1. Trạng thái hợp lệ: PENDING → PAID → PREPARING → READY → COMPLETED. Hủy khi PENDING hoặc PAYMENT_FAILED; PAYMENT_FAILED được thử lại.
2. Idempotency-Key được UNIQUE ở DB, tránh nhiều bản ghi Payment cho cùng key. Phải tránh dùng key khác khi retry do lỗi mạng không biết giao dịch đã hoàn tất.
3. Prisma serializable transaction và kiểm tra `version`/`stock` khi trừ tồn kho.
4. Voucher hợp lệ và loyaltyPoints cộng 1 lần sau khi thanh toán thành công (`floor(total / 10000)`).

**Chưa có cổng thanh toán thực, hệ thống phân quyền quản lý đầy đủ, kiểm thử tải dưới 500ms.**
