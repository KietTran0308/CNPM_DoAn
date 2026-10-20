# Đọc code BrewLite theo thứ tự nào? (Dành cho người mới)

## 1. Ẩn dụ quán cà phê

- `frontend/src/app/page.tsx` = quầy trưng bày, nơi khách nhấn nút.
- `frontend/src/components/` = các màn hình nhỏ: Menu / Giỏ / Đăng nhập / Thanh toán / Đơn hàng.
- `frontend/src/context/CartContext.tsx` = tờ giấy ghi những món khách bỏ vào giỏ. Context có sẵn trong React, không cần Zustand.
- `frontend/src/lib/api.ts` = người phục vụ chuyển yêu cầu từ giao diện đến backend; **mọi `fetch` ở đây**.
- `backend/src/*/*.controller.ts` = nhân viên tiếp nhận yêu cầu HTTP, kiểm tra thông tin hợp lệ.
- `backend/src/*/*.service.ts` = người thực hiện nghiệp vụ (giá, tồn kho, JWT, thanh toán).
- `backend/src/prisma.service.ts` = cầu nối truy cập PostgreSQL.
- `backend/prisma/schema.prisma` = thiết kế các bảng và quan hệ trong CSDL.
- `backend/prisma/seed.ts` = nhập 32 món mẫu + 3 voucher.

## 2. Ví dụ từng bước: khách đặt Cà phê sữa

```text
Khách nhấn "Chọn món" (Menu.tsx)
    ↓
CartContext.add() lưu món, size, topping, số lượng
    ↓
Khách vào "Thanh toán" (Checkout.tsx)
    ↓
api.createOrder()  →  POST /orders + Bearer JWT
    ↓
OrdersController.create() kiểm tra DTO
    ↓
OrdersService.create() đọc giá từ PostgreSQL
    ↓
Prisma: kiểm tra tồn kho + trừ kho + tạo Order(PENDING)
    ↓
api.pay()  →  POST /payments + Idempotency-Key
    ↓
PaymentsService.pay() giả lập thanh toán (không thu tiền thật)
    ↓
Prisma: Payment(SUCCESS) + Order(PAID) + cộng loyaltyPoints
    ↓
Frontend hiển thị mã đơn, trạng thái PAID, tiền thanh toán
```

## 3. Những thư viện nào thực sự phải hiểu?

| Thư viện | Mục đích | Điểm học đầu tiên |
|---|---|---|
| React | Hiển thị HTML động | `useState`, `useEffect`, Context |
| Next.js | Tổ chức và chạy website | `src/app/page.tsx`, `layout.tsx` |
| Tailwind | Viết giao diện bằng class | `bg-white`, `p-4`, `grid` |
| NestJS | Dùng TypeScript tạo API | `@Controller`, `@Get`, `@Post`, `@Injectable` |
| Prisma | Gọi SQL bằng hàm TypeScript | `.findMany`, `.create`, `.$transaction` |
| PostgreSQL | Lưu dữ liệu thật | Bảng Product, User, Order, OrderItem, Payment |
| JWT | Xác nhận ai đang đăng nhập | Bearer token, `JwtGuard` |

**Không dùng các thư viện chưa thiết yếu** như lucide-react, Zustand, React Query, Redux, Express riêng. NestJS đã tự dùng Express ở nền tảng, frontend chỉ cần Context.

## 4. Thử tự sửa một tính năng

Thay giá tăng khi chọn size L:
1. Đổi `SIZE_FEE.L` tại `backend/src/orders/order-logic.ts` (backend mới là nguồn tính tiền đáng tin).
2. Đổi con số hiển thị tạm tính trong `frontend/src/lib/types.ts` và `components/Menu.tsx` để UI khớp.
3. Chạy `npm test` tại backend để thấy các test liên quan.

Đây là ví dụ cố ý đơn giản: sau này có thể làm API trả về bảng giá size/topping để tránh lặp giá ở frontend.
