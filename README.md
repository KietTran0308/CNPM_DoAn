# BrewLite

## 1. Cách chạy dễ nhất - Docker Desktop

Cài Docker Desktop (chế độ Linux containers), sau đó mở Terminal tại **thư mục chứa docker-compose.yml**:

```powershell
Copy-Item .env.example .env
# mở .env, thay JWT_SECRET và mật khẩu PostgreSQL nếu cần
# Chạy cả 3 dịch vụ (PostgreSQL, NestJS, Next.js):
docker compose up --build
```

- Website: http://localhost:3000
- Backend health: http://localhost:4000/health
- Danh sách sản phẩm: http://localhost:4000/products
- PostgreSQL: `localhost:5433` (trong Docker là `db:5432`)

Lần đầu Docker cần Internet để tải image và package npm. `backend` tự tạo bảng bằng Prisma db push và seed 32 sản phẩm + voucher. Để dừng: `Ctrl+C`, hoặc ở Terminal khác `docker compose down`. **Không chạy `docker compose down -v` nếu không muốn mất dữ liệu database.**

## 2. Chạy trên IntelliJ/Terminal không cần build Docker frontend/backend

Chỉ chạy PostgreSQL qua Docker, còn mã nguồn chạy Node.js (>= 20.9) trên máy:

```powershell
# Terminal ở thư mục gốc
Copy-Item .env.example .env
docker compose up -d db

# Terminal backend
cd backend
Copy-Item .env.example .env
npm install
npx prisma generate
npm run db:push
npm run db:seed
npm run dev
```

Mở Terminal thứ hai:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Lưu ý Node.js phải đang trong PATH. Nếu muốn kiểm tra độc lập frontend trước, backend phải đang chạy; ngược lại màn hình sẽ báo lỗi kết nối (thay vì trắng trang). Lần đầu phải tải npm dependency (có Internet).

## 3. Cấu trúc thư mục tối giản

```text
BrewLite_DeHieu_Fullstack/
├── docker-compose.yml             # Bật 3 dịch vụ
├── .env.example                   # Cấu hình phát triển
├── frontend/                      # Next.js + React
│   ├── package.json               # Khai báo thư viện và npm scripts
│   └── src/
│       ├── app/page.tsx            # Điểm vào và chuyển các màn hình
│       ├── app/layout.tsx          # Khung HTML
│       ├── app/globals.css         # Tailwind + ít CSS
│       ├── components/             # Menu, Cart, AuthForm, Checkout, Orders
│       ├── context/CartContext.tsx # React Context: giữ giỏ hàng
│       └── lib/
│           ├── api.ts              # fetch REST API: CHỈ 1 NƠI
│           └── types.ts            # Dữ liệu TypeScript và hàm format tiền
└── backend/                       # NestJS + Prisma
    ├── prisma/schema.prisma        # Cấu trúc bảng
    ├── prisma/seed.ts              # 32 món + voucher
    └── src/
        ├── main.ts                 # Khởi động NestJS
        ├── app.module.ts           # Đăng ký Controller và Service
        ├── prisma.service.ts       # Kết nối PostgreSQL
        ├── auth/                   # register, login, JWT guard
        ├── products/               # GET /products
        ├── orders/                 # POST /orders, kiểm kho, state machine
        └── payments/               # POST /payments, idempotency
```

**Đọc `docs/01-HUONG-DI-CUA-CODE.md` để lần theo flow đặt hàng từng bước**; đọc `docs/02-API.md` để test POST với Postman.

## Thứ tự chạy:
1. Mở menu: tìm các món, chọn size/topping, thêm 2 món vào giỏ.
2. Mở giỏ: tăng/giảm số lượng và nhìn tổng tiền.
3. Đăng ký: email chưa dùng + mật khẩu tối thiểu 6 ký tự; đăng nhập.
4. Chọn Ví/Thẻ; thử voucher `BANMOI15` (đơn >=40.000đ), chọn thanh toán. Màn hình xác nhận hiện mã đơn `PAID`.
5. Mở Lịch sử đơn và xem trạng thái, tổng tiền; đăng nhập lại vẫn thấy vì dữ liệu trong PostgreSQL.
6. Bật "Mô phỏng thất bại", thử lại bằng checkbox bỏ chọn; giỏ hàng vẫn được giữ khi thanh toán lỗi.
7. Demo Task 10 qua unit test và kiểm tra integration riêng.

## 5. Kiểm thử

```powershell
cd backend
npm test            # unit test state machine, giá size/topping
npm run build       # biên dịch NestJS
```

**Integration test bắt buộc có PostgreSQL test riêng**, không dùng DB lưu đơn cá nhân. Đặt `TEST_DATABASE_URL`, chạy `DATABASE_URL=<testdb> npx prisma db push` theo shell phù hợp và sau đó `npm run test:integration`. Khi không cấu hình `TEST_DATABASE_URL`, Jest chủ động skip integration chứ không xác nhận đã đạt. Xem test `backend/test/integration.spec.ts`.

## 6. Tình trạng và giới hạn

- Đã viết backend cơ bản và cấu trúc frontend đơn giản. Cấu hình có logic kiểm kho giao dịch, khóa idempotency, voucher/loyalty.
- Đây là bản **để học và thử nghiệm**, không dành cho người dùng thật; thanh toán là mock; JWT ở localStorage chỉ nên dùng trong demo (production cần cơ chế cookie httpOnly, rate limit, quản lý secret và quyền truy cập chặt hơn).
- Chưa thể xác nhận `npm install`, `next build`, `nest build`, hoặc Docker end-to-end trên môi trường soạn file vì npm registry hiện không truy cập được. Sau khi tải về, hãy chạy các lệnh trên máy có Internet và gửi log nếu còn lỗi.
- Scrum (Product Backlog, Sprint Planning, Daily, Review, Retrospective, Burndown), commit/review Git và benchmark API <500ms vẫn cần nhóm thực hiện, lưu bằng chứng theo đề.
- Bản này **ưu tiên MVP dễ hiểu**, không chuyển toàn bộ tiện ích tài khoản, đổi mật khẩu, voucher nâng cao của giao diện cũ; source ZIP bạn gửi vẫn riêng biệt không bị ghi đè.

## 7. Kiểm tra API end-to-end bằng một lệnh (không cần Postman)

Khi NestJS + PostgreSQL đã chạy:

```powershell
cd backend
npm run smoke
```

Script `backend/scripts/smoke.mjs` tự tạo tài khoản thử (email ngẫu nhiên), lấy menu, đặt đơn, trả tiền giả lập, gửi lại cùng Idempotency-Key và đọc lịch sử. Nó tạo dữ liệu thật trong DB phát triển; **không chạy trên production**. Nếu in `SMOKE TEST PASSED!`, các API chính đã chạy trong môi trường của bạn. Đây là **script được cung cấp để bạn tự chạy**, chưa được thực thi end-to-end trong môi trường soạn file.

## 8. Scrum theo đề bài
