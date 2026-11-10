BREWLITE
BrewLite là đồ án môn Công nghệ phần mềm, xây dựng website đặt đồ uống và thanh toán không dùng tiền mặt.

Công nghệ sử dụng:
- Frontend: Next.js, React, TypeScript.
- Backend: NestJS, TypeScript, Prisma ORM.
- Database: PostgreSQL.
- Chạy local: Docker Compose.
- Triển khai online: Render.
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
- Git (nếu lấy source từ GitHub).
- Docker Desktop và bật Docker Engine.
- pgAdmin 4 (không bắt buộc, chỉ để xem database).
  Nếu chạy không dùng Docker, cần cài thêm Node.js 22, npm và PostgreSQL 16.

Tải hoặc clone source code về máy, sau đó mở PowerShell trong thư mục BrewLite, nơi có file docker-compose.yml.
3. Chạy dự án bằng Docker (khuyên dùng)
   Bước 1: Tạo file môi trường
   Tại thư mục gốc BrewLite, chạy:
   Copy-Item .env.example .env
   Mở file .env và chỉnh các giá trị. Ví dụ:
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=MAT_KHAU_DOCKER_RIENG
   POSTGRES_DB=brewlite_local
   JWT_SECRET=CHUOI_BI_MAT_NGAU_NHIEN_DAI_IT_NHAT_32_KY_TU
   Đây chỉ là giá trị mẫu. Tự đặt mật khẩu và JWT secret riêng. Không dùng thông tin kết nối database Render trong file này.

Nếu bạn đã chạy Docker thành công và có dữ liệu thì giữ nguyên tên database và mật khẩu trong .env đang sử dụng; không tự đổi POSTGRES_DB khi volume cũ còn tồn tại.
Bước 2: Khởi động Docker
Mở Docker Desktop, sau đó chạy:
docker compose up --build -d
Kiểm tra các dịch vụ:
docker compose ps
Cần có ba dịch vụ: db, backend, frontend.
Bước 3: Truy cập hệ thống
- Frontend: http://localhost:3100
- Backend (kiểm tra hoạt động): http://localhost:4100/health
- API danh sách sản phẩm: http://localhost:4100/products
  Các cổng trên áp dụng cho docker-compose.yml local đang dùng: 3100 (frontend), 4100 (backend) và 5433 (PostgreSQL trên máy).

Lần đầu chạy với volume database mới, Docker tự thực thi file backend/prisma/dbBrewLite.sql để tạo bảng và thêm dữ liệu mẫu. Những lần chạy tiếp theo sẽ dùng lại dữ liệu hiện có, không tự import SQL lần nữa.
Bước 4: Kết nối database Docker bằng pgAdmin (tùy chọn)
Mở pgAdmin, chọn Register > Server và nhập:
Name:                 BrewLite Docker Local
Host name/address:    127.0.0.1
Port:                 5433
Maintenance database: brewlite_local
Username:             postgres
Password:             mật khẩu POSTGRES_PASSWORD trong .env
Nếu POSTGRES_DB trong .env của bạn là brewlite thì dùng brewlite thay cho brewlite_local ở ô Maintenance database.

Sau khi kết nối, vào Databases > tên database > Schemas > public > Tables để xem các bảng.

Có thể kiểm tra tên database thực tế bằng lệnh:
docker compose exec db psql -U postgres -d postgres -c "SELECT datname FROM pg_database WHERE datistemplate = false;"
Bước 5: Kiểm tra chức năng
1. Mở http://localhost:3100 và kiểm tra thực đơn có tên, hình ảnh, giá sản phẩm.
2. Thử đăng ký hoặc đăng nhập tài khoản.
3. Chọn size, topping và thêm món vào giỏ hàng.
4. Thử đặt hàng và thanh toán mô phỏng.
5. Xem lịch sử đơn và kiểm tra dữ liệu mới trong pgAdmin của Docker.
   Nếu tất cả hoạt động thì frontend, backend và database đã kết nối với nhau.
4. Các lệnh Docker thường dùng
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

Nếu sửa địa chỉ NEXT_PUBLIC_API_URL, cần build lại frontend vì Next.js sử dụng giá trị này trong quá trình build:
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
DATABASE_URL="postgresql://postgres:MAT_KHAU_POSTGRES@localhost:5432/dbBrewLite?schema=public"
JWT_SECRET="CHUOI_BI_MAT_NGAU_NHIEN_DAI_IT_NHAT_32_KY_TU"
FRONTEND_URL="http://localhost:3000"
PORT=4000
Thay MAT_KHAU_POSTGRES bằng mật khẩu của PostgreSQL trên máy. Nếu mật khẩu có ký tự đặc biệt, cần mã hóa đúng khi đặt trong URL.

Khởi động backend:
npm run dev
Kiểm tra: http://localhost:4000/health và http://localhost:4000/products.
Bước 3: Chạy frontend
Mở PowerShell thứ hai tại thư mục BrewLite:
cd frontend
npm ci
Tạo file frontend/.env.local:
NEXT_PUBLIC_API_URL=http://localhost:4000
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
$env:API_URL="http://localhost:4100"
npm run smoke
Smoke test kiểm tra /health và danh sách sản phẩm. Backend còn có npm run test:e2e, nhưng bài kiểm tra này tạo tài khoản và đơn hàng thật; chỉ chạy trên database test/local, không chạy trên database Render.

Nếu thay đổi schema.prisma, cần chạy lại npx prisma generate và quản lý thay đổi cấu trúc database tương ứng. Không tự ý chạy lệnh reset database production.
7. Triển khai trên Render
   Dự án đang sử dụng Render để chạy online. Render và Docker local được cấu hình độc lập:
- Render chạy frontend, backend và sử dụng PostgreSQL production của Render.
- Docker local chạy frontend, backend và PostgreSQL riêng trên máy.
- Hai database không tự đồng bộ dữ liệu.
  Khi cấu hình môi trường Render, cần bảo đảm:

Backend trên Render:
DATABASE_URL = URL kết nối PostgreSQL Render
JWT_SECRET   = JWT secret dành riêng cho production
FRONTEND_URL = URL website frontend Render (https://...)
PORT         = cổng ứng dụng phù hợp cấu hình dịch vụ
Frontend trên Render:
NEXT_PUBLIC_API_URL = URL backend Render (https://...)
Các bước triển khai cơ bản nếu tạo dịch vụ Render mới:
1. Đẩy source code lên GitHub, không đưa các file .env chứa mật khẩu lên Git.
2. Tạo PostgreSQL trên Render và lấy thông tin kết nối từ Render Dashboard.
3. Tạo Web Service cho backend, trỏ tới thư mục backend, thiết lập các biến môi trường và cấu hình build/start theo source.
4. Tạo Web Service cho frontend, trỏ tới thư mục frontend, đặt NEXT_PUBLIC_API_URL trước khi build frontend.
5. Cập nhật FRONTEND_URL bên backend thành địa chỉ frontend thật trên Render.
6. Deploy và kiểm tra /health, /products, sau đó thử các chức năng trên website.
   Nếu Render hiện đã chạy ổn định, giữ nguyên build command, start command và biến môi trường đang sử dụng; không cần sửa chúng chỉ vì đã thêm Docker local. Khi push lên nhánh GitHub mà Render bật Auto Deploy, Render có thể triển khai bản mới.

Không chạy lại file SQL khởi tạo hoặc các lệnh xóa/reset dữ liệu trên PostgreSQL Render đang có dữ liệu.
8. Một số lỗi thường gặp
   Docker không chạy: Kiểm tra Docker Desktop đã mở chưa. Chạy docker compose ps và xem log dịch vụ bị lỗi.

pgAdmin báo connection timeout: Kiểm tra db có trạng thái healthy và đang mở cổng 127.0.0.1:5433 bằng docker compose ps.

Báo database không tồn tại: Kiểm tra POSTGRES_DB trong .env và tên database thực tế bằng lệnh ở mục 3. Đổi tên trong .env không tự tạo database mới trên volume đã có dữ liệu.

Frontend mở được nhưng không tải sản phẩm: Kiểm tra http://localhost:4100/products, log backend và NEXT_PUBLIC_API_URL dùng lúc build frontend Docker.

Backend không kết nối PostgreSQL: Trong Docker, địa chỉ database là db:5432, không phải localhost:5433. Kiểm tra DATABASE_URL, mật khẩu và log backend/db.

Cổng đã được sử dụng: Kiểm tra ứng dụng khác đang dùng cổng 3100, 4100 hoặc 5433 trước khi đổi cổng trong docker-compose.yml.

Đổi SQL nhưng không thấy thay đổi: Script khởi tạo PostgreSQL chỉ chạy khi tạo volume mới. Muốn thay đổi database đã tồn tại, cần dùng script cập nhật/migration phù hợp và sao lưu dữ liệu trước.