BREWLITE
BrewLite là đồ án môn Công nghệ phần mềm, xây dựng website đặt đồ uống và thanh toán không dùng tiền mặt.

Công nghệ sử dụng:

* Frontend: Next.js, React, TypeScript.
* Backend: NestJS, TypeScript, Prisma ORM.
* Database: PostgreSQL.
* Chạy local: Docker Compose.
* Triển khai online: Render.
Các chức năng chính: xem thực đơn, chọn size và topping, quản lý giỏ hàng, đăng ký/đăng nhập, đặt hàng, thanh toán mô phỏng bằng ví/thẻ, xem trạng thái và lịch sử đơn hàng.
1. Cấu trúc dự án
BrewLite/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── dbBrewLite.sql
│   ├── src/
│   ├── Dockerfile
│   ├── Dockerfile.local
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   ├── Dockerfile.frontend
│   └── package.json
├── docker-compose.yml
├── .env.example
├── .env                  (tự tạo, không đưa lên Git)
└── README.md
Lưu ý: thư mục backend và frontend phải nằm ngay trong BrewLite, không lồng thêm một thư mục cùng tên.
2. Chuẩn bị
Cách đơn giản nhất là chạy bằng Docker. Cần cài:
* Git (nếu lấy source từ GitHub).
* Docker Desktop và bật Docker Engine.
* pgAdmin 4 (không bắt buộc, chỉ để xem database).
Nếu chạy không dùng Docker, cần cài thêm Node.js 22, npm và PostgreSQL 16.

Tải hoặc clone source code về máy, sau đó mở PowerShell trong thư mục BrewLite, nơi có file docker-compose.yml.

3. Chạy dự án bằng Docker (khuyên dùng)
Bước 1: Tạo file môi trường
Tại thư mục gốc BrewLite, chạy:
Copy-Item .env.example .env
Mở file .env và chỉnh các giá trị. Ví dụ:
POSTGRES\_USER=postgres
POSTGRES\_PASSWORD=MAT\_KHAU\_DOCKER\_RIENG
POSTGRES\_DB=brewlite\_local
JWT\_SECRET=CHUOI\_BI\_MAT\_NGAU\_NHIEN\_DAI\_IT\_NHAT\_32\_KY\_TU
Đây chỉ là giá trị mẫu. Tự đặt mật khẩu và JWT secret riêng. Không dùng thông tin kết nối database Render trong file này.

Nếu bạn đã chạy Docker thành công và có dữ liệu thì giữ nguyên tên database và mật khẩu trong .env đang sử dụng; không tự đổi POSTGRES\_DB khi volume cũ còn tồn tại.
Bước 2: Khởi động Docker
Mở Docker Desktop, sau đó chạy:
docker compose up --build -d
Kiểm tra các dịch vụ:
docker compose ps
Cần có ba dịch vụ: db, backend, frontend.
Bước 3: Truy cập hệ thống

* Frontend: http://localhost:3100
* Backend (kiểm tra hoạt động): http://localhost:4100/health
* API danh sách sản phẩm: http://localhost:4100/products
Các cổng trên áp dụng cho docker-compose.yml local đang dùng: 3100 (frontend), 4100 (backend) và 5433 (PostgreSQL trên máy).

Lần đầu chạy với volume database mới, Docker tự thực thi file backend/prisma/dbBrewLite.sql để tạo bảng và thêm dữ liệu mẫu. Những lần chạy tiếp theo sẽ dùng lại dữ liệu hiện có, không tự import SQL lần nữa.
Bước 4: Kết nối database Docker bằng pgAdmin (tùy chọn)
Mở pgAdmin, chọn Register > Server và nhập:
Name:                 BrewLite Docker Local
Host name/address:    127.0.0.1
Port:                 5433
Maintenance database: brewlite\_local
Username:             postgres
Password:             mật khẩu POSTGRES\_PASSWORD trong .env
Nếu POSTGRES\_DB trong .env của bạn là brewlite thì dùng brewlite thay cho brewlite\_local ở ô Maintenance database.

Sau khi kết nối, vào Databases > tên database > Schemas > public > Tables để xem các bảng.

Có thể kiểm tra tên database thực tế bằng lệnh:
docker compose exec db psql -U postgres -d postgres -c "SELECT datname FROM pg\_database WHERE datistemplate = false;"
Bước 5: Kiểm tra chức năng

1. Mở http://localhost:3100 và kiểm tra thực đơn có tên, hình ảnh, giá sản phẩm.
2. Thử đăng ký hoặc đăng nhập tài khoản.
3. Chọn size, topping và thêm món vào giỏ hàng.
4. Thử đặt hàng và thanh toán mô phỏng.
5. Xem lịch sử đơn và kiểm tra dữ liệu mới trong pgAdmin của Docker.
Nếu tất cả hoạt động thì frontend, backend và database đã kết nối với nhau.
6. Các lệnh Docker thường dùng

# Khởi động lại các container đã tạo

docker compose up -d

# Build lại sau khi sửa code hoặc cấu hình build

docker compose up --build -d

# Kiểm tra trạng thái

docker compose ps

# Xem log

docker compose logs --tail=100 db
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend

# Dừng các container, vẫn giữ dữ liệu

docker compose down
Không dùng docker compose down -v nếu muốn giữ dữ liệu PostgreSQL local, vì lệnh đó sẽ xóa volume database của dự án.

Nếu sửa địa chỉ NEXT\_PUBLIC\_API\_URL, cần build lại frontend vì Next.js sử dụng giá trị này trong quá trình build:
docker compose build frontend
docker compose up -d frontend
5. Chạy không dùng Docker (tùy chọn)
Chọn cách này khi đã cài Node.js, npm và PostgreSQL trực tiếp trên máy. Nếu đang chạy Docker thì có thể dừng trước bằng docker compose down.
Bước 1: Tạo database
Trong pgAdmin của PostgreSQL cài trên máy, tạo database mới tên dbBrewLite.

Chọn database vừa tạo, mở Query Tool và chạy file backend/prisma/dbBrewLite.sql một lần để tạo bảng và dữ liệu mẫu. Không chạy lại toàn bộ file SQL nếu database đã có dữ liệu.
Bước 2: Chạy backend
Mở PowerShell thứ nhất tại thư mục BrewLite:
cd backend
npm ci
npx prisma generate
Tạo file backend/.env:
DATABASE\_URL="postgresql://postgres:MAT\_KHAU\_POSTGRES@localhost:5432/dbBrewLite?schema=public"
JWT\_SECRET="CHUOI\_BI\_MAT\_NGAU\_NHIEN\_DAI\_IT\_NHAT\_32\_KY\_TU"
FRONTEND\_URL="http://localhost:3000"
PORT=4000
Thay MAT\_KHAU\_POSTGRES bằng mật khẩu của PostgreSQL trên máy. Nếu mật khẩu có ký tự đặc biệt, cần mã hóa đúng khi đặt trong URL.

Khởi động backend:
npm run dev
Kiểm tra: http://localhost:4000/health và http://localhost:4000/products.
Bước 3: Chạy frontend
Mở PowerShell thứ hai tại thư mục BrewLite:
cd frontend
npm ci
Tạo file frontend/.env.local:
NEXT\_PUBLIC\_API\_URL=http://localhost:4000
Khởi động frontend:
npm run dev
Mở http://localhost:3000.

Lưu ý: khi chạy không có Docker thì dùng cổng 3000/4000. Khi chạy theo Docker Compose local ở mục 3 thì dùng cổng 3100/4100.
6. Kiểm tra và build source code
Các lệnh dưới đây chạy tại thư mục tương ứng sau khi đã npm ci.

Backend:
cd backend
npx prisma generate
npm run lint
npm test
npm run build
Frontend:
cd frontend
npm run lint
npm test
npm run build
Có thể chạy smoke test khi API Docker đã hoạt động. Mở PowerShell trong thư mục backend:
$env:API\_URL="http://localhost:4100"
npm run smoke
Smoke test kiểm tra /health và danh sách sản phẩm. Backend còn có npm run test:e2e, nhưng bài kiểm tra này tạo tài khoản và đơn hàng thật; chỉ chạy trên database test/local, không chạy trên database Render.

Nếu thay đổi schema.prisma, cần chạy lại npx prisma generate và quản lý thay đổi cấu trúc database tương ứng. Không tự ý chạy lệnh reset database production.
7. Triển khai trên Render
Dự án đang sử dụng Render để chạy online. Render và Docker local được cấu hình độc lập:

* Render chạy frontend, backend và sử dụng PostgreSQL production của Render.
* Docker local chạy frontend, backend và PostgreSQL riêng trên máy.
* Hai database không tự đồng bộ dữ liệu.
Khi cấu hình môi trường Render, cần bảo đảm:

Backend trên Render:
DATABASE\_URL = URL kết nối PostgreSQL Render
JWT\_SECRET   = JWT secret dành riêng cho production
FRONTEND\_URL = URL website frontend Render (https://...)
PORT         = cổng ứng dụng phù hợp cấu hình dịch vụ
Frontend trên Render:
NEXT\_PUBLIC\_API\_URL = URL backend Render (https://...)
Các bước triển khai cơ bản nếu tạo dịch vụ Render mới:

1. Đẩy source code lên GitHub, không đưa các file .env chứa mật khẩu lên Git.
2. Tạo PostgreSQL trên Render và lấy thông tin kết nối từ Render Dashboard.
3. Tạo Web Service cho backend, trỏ tới thư mục backend, thiết lập các biến môi trường và cấu hình build/start theo source.
4. Tạo Web Service cho frontend, trỏ tới thư mục frontend, đặt NEXT\_PUBLIC\_API\_URL trước khi build frontend.
5. Cập nhật FRONTEND\_URL bên backend thành địa chỉ frontend thật trên Render.
6. Deploy và kiểm tra /health, /products, sau đó thử các chức năng trên website.
Nếu Render hiện đã chạy ổn định, giữ nguyên build command, start command và biến môi trường đang sử dụng; không cần sửa chúng chỉ vì đã thêm Docker local. Khi push lên nhánh GitHub mà Render bật Auto Deploy, Render có thể triển khai bản mới.

Không chạy lại file SQL khởi tạo hoặc các lệnh xóa/reset dữ liệu trên PostgreSQL Render đang có dữ liệu.
8. Một số lỗi thường gặp
Docker không chạy: Kiểm tra Docker Desktop đã mở chưa. Chạy docker compose ps và xem log dịch vụ bị lỗi.

pgAdmin báo connection timeout: Kiểm tra db có trạng thái healthy và đang mở cổng 127.0.0.1:5433 bằng docker compose ps.

Báo database không tồn tại: Kiểm tra POSTGRES\_DB trong .env và tên database thực tế bằng lệnh ở mục 3. Đổi tên trong .env không tự tạo database mới trên volume đã có dữ liệu.

Frontend mở được nhưng không tải sản phẩm: Kiểm tra http://localhost:4100/products, log backend và NEXT\_PUBLIC\_API\_URL dùng lúc build frontend Docker.

Backend không kết nối PostgreSQL: Trong Docker, địa chỉ database là db:5432, không phải localhost:5433. Kiểm tra DATABASE\_URL, mật khẩu và log backend/db.

Cổng đã được sử dụng: Kiểm tra ứng dụng khác đang dùng cổng 3100, 4100 hoặc 5433 trước khi đổi cổng trong docker-compose.yml.

Đổi SQL nhưng không thấy thay đổi: Script khởi tạo PostgreSQL chỉ chạy khi tạo volume mới. Muốn thay đổi database đã tồn tại, cần dùng script cập nhật/migration phù hợp và sao lưu dữ liệu trước.

\---

## 9\. Các sửa đổi của bản vá 12/11/2026

**Đây là bản vá nâng cấp trực tiếp từ source người dùng cung cấp, không thay framework và không reset database.**

* Thanh toán WALLET/CARD **chỉ là mô phỏng**, Backend mặc định từ chối nếu `ENABLE\\\_DEMO\\\_PAYMENTS` không phải `true`. Local Docker có thể bật biến này để bảo vệ tính năng demo; Render production nên luôn để `false`. Frontend tương ứng chỉ cho lựa chọn VNPay khi chưa bật demo.
* Frontend không yêu cầu số thẻ/CVV thật. Đây không phải cổng thu thập dữ liệu thẻ ngân hàng.
* Thanh toán VNPay được lưu kết quả đã xác nhận vào `payments` **trước** khi cố gắng hoàn tất trạng thái đơn. Nếu kho, điểm, coupon bị thay đổi, hệ thống giữ dấu vết `payment=SUCCESS`, `order=PENDING` và cho ADMIN đối soát; không tự đánh dấu FAILED hoặc hoàn tiền giả.
* Khi VNPay không gửi IPN, giao dịch giữ `PENDING` cho đến khi đối soát. `GET /payments/vnpay/reconciliation` và `POST /payments/vnpay/recheck/:orderId` (ADMIN) hỗ trợ tra cứu QueryDR đã xác minh checksum từ VNPay. Phản hồi không chắc chắn vẫn được giữ nguyên để xử lý thủ công.
* `GET /payments/vnpay/status?orderId=...` (chủ đơn) trả về `requiresReconciliation`/`awaitingGateway` để màn hình Return không nhận định sai.
* Frontend nhớ `Idempotency-Key` của giao dịch VNPay trong `sessionStorage` và khôi phục đơn đang xử lý khi trở lại trang. Không khởi tạo thanh toán giả nếu không nhận được trả lời của API.
* `GET /orders/queue` cung cấp hàng đợi cho STAFF/ADMIN; `GET /products/inventory` và `POST /products/inventory/restock` ghi nhận nhập kho nguyên liệu và nhân viên thao tác trong cùng transaction.
* Frontend `/staff` cho phép xem hàng đợi, cập nhật trạng thái, nhập kho và (ADMIN) quản lý giao dịch VNPay cần đối soát.
* Thêm giới hạn đăng nhập/đăng ký cơ bản trong bộ nhớ của một tiến trình (không thay thế Redis/rate limit ở proxy khi chạy nhiều instance).
* Docker Compose truyền các biến VNPay an toàn đến Backend, thêm OpenSSL trên Dockerfile Backend để tương thích Prisma Alpine.
* Các file `.env` chứa thông tin nhạy cảm **không** có trong bộ source đã đóng gói; chỉ có `.env.example`.

### 9.1. Cấu hình local (Docker)

Tại thư mục gốc:

```powershell
Copy-Item .env.example .env
# Chỉnh POSTGRES\\\_PASSWORD và JWT\\\_SECRET đủ mạnh trong .env.
docker compose up --build -d
```

Để dùng thanh toán **mô phỏng**, đặt `ENABLE\\\_DEMO\\\_PAYMENTS=true` trong `.env` trước khi build, sau đó `docker compose up --build -d`.

Nếu chỉ thử cổng VNPay Sandbox, đặt `ENABLE\\\_DEMO\\\_PAYMENTS=false` và sử dụng **TMN\_CODE/HASH\_SECRET thật do VNPay cấp**. Điền `VNPAY\\\_RETURN\\\_URL` HTTPS công khai (ví dụ `https://<backend-domain>/payments/vnpay/return`) và đăng ký IPN URL `https://<backend-domain>/payments/vnpay/ipn` trong Merchant Portal. IPN không thể hoạt động end-to-end qua `localhost` nếu VNPay không thể gọi về Backend. Có thể dùng một domain HTTPS/tunnel kiểm soát được trong quá trình thử.

### 9.2. Cấu hình Backend trên Render

Thiết lập các biến môi trường trong Render Dashboard, **không đẩy file .env lên GitHub**:

|Biến|Ý nghĩa|
|-|-|
|`DATABASE\\\_URL`|Địa chỉ PostgreSQL Render đang chạy|
|`JWT\\\_SECRET`|Chuỗi ngẫu nhiên mạnh, riêng cho Render|
|`FRONTEND\\\_URL`|URL website Frontend HTTPS|
|`ENABLE\\\_DEMO\\\_PAYMENTS`|`false` cho site public, tránh thanh toán giả|
|`VNPAY\\\_TMN\\\_CODE`|TMN\_CODE thật của tài khoản Sandbox|
|`VNPAY\\\_HASH\\\_SECRET`|HASH\_SECRET thật, chỉ trên Backend|
|`VNPAY\\\_PAYMENT\\\_URL`|`https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` (khi thử Sandbox)|
|`VNPAY\\\_RETURN\\\_URL`|`https://<backend-domain>/payments/vnpay/return`|
|`VNPAY\\\_API\\\_URL`|`https://sandbox.vnpayment.vn/merchant\\\_webapi/api/transaction`|
|`VNPAY\\\_IP\\\_ADDR`|Địa chỉ IP server hợp lệ cho QueryDR, nếu VNPay yêu cầu; xem cấu hình mạng thực tế|

Frontend Render đặt `NEXT\\\_PUBLIC\\\_API\\\_URL=https://<backend-domain>` và `NEXT\\\_PUBLIC\\\_ENABLE\\\_DEMO\\\_PAYMENTS=false` **trước khi build**. Khi dùng build bằng Docker, cần truyền chúng làm build-args. Không đặt HASH\_SECRET/JWT\_SECRET/DB password vào biến `NEXT\\\_PUBLIC\\\_\\\*`.

**Chú ý**: `.env` người dùng gửi chứa placeholder TMN/HASH và Return URL ví dụ; bản vá KHÔNG có khả năng tự lấy mã merchant từ VNPay. IPN URL không tự được đăng ký chỉ bằng biến `VNPAY\\\_IPN\\\_URL`: phải khai báo ở cổng quản trị VNPay.

### 9.3. API mới và kiểm thử

Sau khi login tài khoản STAFF/ADMIN, mở `/staff`. Các API có JWT guard và kiểm tra quyền trực tiếp ở Backend:

* `GET /orders/queue?limit=50` — xem đơn cần xử lý.
* `PATCH /orders/:id/status` — PAID → PREPARING → READY → COMPLETED (đã có, nay có UI STAFF).
* `GET /products/inventory` — xem nguyên liệu.
* `POST /products/inventory/restock` — `{ "ingredientId": "uuid", "quantity": 1.500, "note": "Nhập kho" }`, ghi nhận `performed\\\_by`.
* `GET /payments/vnpay/reconciliation` — ADMIN xem pending quá hạn hoặc tiền đã nhận mà đơn chưa hoàn thành.
* `POST /payments/vnpay/recheck/:orderId` — ADMIN yêu cầu VNPay QueryDR và đồng bộ kết quả xác thực.

Trước deploy hãy chạy:

```powershell
cd backend
npm ci
npx prisma generate
npm run lint
npm test
npm run build
cd ../frontend
npm ci
npm run lint
npm test
npm run build
```

Không chạy `prisma db push`/`migrate reset` vào Render production nếu không có kế hoạch migration và backup. Không chạy lại SQL seed trên database đang có dữ liệu. `backend/prisma/dbBrewLite.sql` là **seed cho DB mới/trống** (Docker). `dbBrewLite\\\_export\\\_tham\\\_khao.sql` (nếu tải riêng, không nằm trong ZIP source để tránh công khai dữ liệu tài khoản) là bản export tham khảo, có dữ liệu lịch sử và cú pháp `OVERRIDING SYSTEM VALUE` để import lên DB **mới/trống**; không được import nó vào DB Render đang vận hành.

