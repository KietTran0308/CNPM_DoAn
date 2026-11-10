BREWLITE

Dự án gồm:
- backend: NestJS + Prisma
- frontend: Next.js
- database: PostgreSQL

1. Chạy không dùng Docker

Cần cài Node.js, npm và PostgreSQL.

Tạo database tên brewlite bằng pgAdmin.
Nếu database mới, chạy file backend/prisma/BrewLite_PostgreSQL_hoan_chinh.sql trong Query Tool.
Nếu database đã có dữ liệu, không chạy lại file SQL tạo toàn bộ bảng.

Mở terminal thứ nhất tại thư mục BrewLite, chạy:
cd backend
npm ci

Tạo file backend/.env (điền đúng mật khẩu PostgreSQL của máy):
DATABASE_URL="postgresql://postgres:MAT_KHAU@localhost:5432/brewlite?schema=public"
JWT_SECRET="thay_bang_mot_chuoi_bi_mat_dai_va_ngau_nhien"
FRONTEND_URL="http://localhost:3000"
PORT=4000

Chạy tiếp:
npx prisma generate
npm run dev

Mở terminal thứ hai tại thư mục BrewLite, chạy:
cd frontend
npm ci

Tạo file frontend/.env.local:
NEXT_PUBLIC_API_URL=http://localhost:4000

Chạy:
npm run dev

Truy cập giao diện: http://localhost:3000
Địa chỉ API: http://localhost:4000

2. Chạy bằng Docker

Cần cài và mở Docker Desktop.
Giữ backend/Dockerfile và frontend/Dockerfile.frontend.
Dùng một file docker-compose.yml ở thư mục gốc BrewLite.

Tạo file BrewLite/.env:
POSTGRES_USER=postgres
POSTGRES_PASSWORD=THAY_MAT_KHAU
POSTGRES_DB=brewlite
JWT_SECRET=thay_bang_mot_chuoi_bi_mat_dai_va_ngau_nhien

Mở terminal tại thư mục BrewLite, chạy:
docker compose up --build -d

Mở http://localhost:3000
Xem log: docker compose logs -f
Dừng ứng dụng: docker compose down

Docker dùng cổng 3000 (frontend), 4000 (backend), 5433 (PostgreSQL trên máy).
Lần đầu tạo database mới bằng Docker, file SQL được nhập tự động.
Nếu database trong Docker đã tồn tại, file SQL sẽ không được nhập lại.
Không chạy docker compose down -v nếu muốn giữ dữ liệu.

3. Kiểm tra build

Tại thư mục backend:
npm run build

Tại thư mục frontend:
npm run build

Lưu ý:
- Không đưa .env và .env.local lên Git.
- Nếu sửa schema.prisma, chạy lại npx prisma generate trong backend.
- Nếu thư mục hoặc tên file SQL của bạn khác, sửa đường dẫn trong docker-compose.yml.
