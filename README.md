# BrewLite — Ứng Dụng Gọi Món Cà Phê Full-Stack Production

Ứng dụng web đặt cà phê, bánh ngọt và kem thủ công hoạt động theo mô hình **gọi món trực tuyến – thanh toán – nhận tại quầy Barista** kết hợp hệ thống hội viên thân thiết (BrewLite Rewards), chạy trên kiến trúc Full-Stack Production hoàn chỉnh kết nối Cơ sở dữ liệu SQL.

---

## 1. Kiến Trúc Full-Stack (Full-Stack Architecture)

```text
├── schema.sql                         # Khởi tạo bảng SQL & nạp dữ liệu gốc (32 món thực đơn, chi nhánh, voucher)
├── server.ts                          # Server Entry Point (Express API + Vite Dev Server trên cổng 3000)
├── server/                            # Backend API Service
│   ├── auth.ts                        # Mã hóa mật khẩu (bcryptjs) & Ký/Xác thực JWT Token
│   ├── db.ts                          # Bộ quản lý kết nối SQL (PostgreSQL Pool + Embedded SQLite fallback)
│   └── routes/
│       ├── auth.ts                    # POST /api/auth/register, /api/auth/login, GET /api/auth/me, PUT /api/auth/profile
│       ├── menu.ts                    # GET /api/menu, GET /api/menu/:id, POST /api/menu, PUT /api/menu/:id, DELETE
│       ├── orders.ts                  # GET /api/orders, POST /api/orders, GET /api/orders/:id, PUT /api/orders/:id/status
│       └── meta.ts                    # GET /api/branches, GET /api/vouchers, GET /api/loyalty-history
├── src/                               # Frontend Single Page Application (React 19 + TypeScript + Tailwind CSS)
│   ├── components/                    # Thành phần giao diện (MenuPage, CartDrawer, CheckoutPage, OrderHistoryPage...)
│   ├── context/                       # AppContext kết nối toàn diện Store và API
│   ├── constants/                     # Cấu hình hằng số (SIZES, TOPPINGS, PAYMENT_METHODS, DEFAULT_BRANCHES)
│   ├── hooks/                         # React Query Hooks (useProducts, useOrders, useAuth, useVoucher...)
│   ├── services/                      # HTTP API Client kết nối Backend qua fetch
│   ├── stores/                        # Zustand Store (Auth, Cart, UI)
│   ├── types/                         # TypeScript interfaces (Product, Order, User, CartItem...)
│   └── utils/                         # Helpers định dạng tiền VND, ngày giờ, trạng thái đơn
├── .env.example                       # Mẫu cấu hình biến môi trường kết nối SQL
└── package.json                       # Scripts và dependencies dự án
```

---

## 2. Thiết Kế Cơ Sở Dữ Liệu SQL (`schema.sql`)

Hệ thống cơ sở dữ liệu quan hệ tuân theo chuẩn ANSI SQL, tương thích 100% với cả **PostgreSQL** và **SQLite**:

1. **`users`**: Quản lý tài khoản khách hàng, mật khẩu băm bảo mật (`password_hash` qua bcrypt), hạng hội viên (`membership_tier`), điểm thưởng tích lũy (`loyalty_points`), chi nhánh ưa thích.
2. **`menu_items`**: Lưu trữ 32 món ăn/thức uống gốc phân theo 5 danh mục (*Cà phê Việt Nam, Cà phê pha máy, Trà & Trà sữa, Bánh ngọt & Bánh mì, Kem Gelato thủ công*), hỗ trợ cờ ẩn/hiện món (`is_active`).
3. **`branches`**: Quản lý mạng lưới chi nhánh quầy Barista nhận nước.
4. **`vouchers`**: Quản lý mã ưu đãi, mức giảm giá, đơn hàng tối thiểu và điểm thưởng cần để đổi.
5. **`orders`**: Lưu trữ đơn hàng phát sinh riêng biệt theo từng `user_id`, mã nhận tại quầy (`pickup_code`), trạng thái pha chế (`PAID`, `PREPARING`, `READY`, `COMPLETED`), phương thức thanh toán.
6. **`order_items`**: Chi tiết từng món trong đơn (size, lượng đá, lượng đường, ghi chú, danh sách topping JSON).
7. **`loyalty_history`**: Nhật ký giao dịch cộng/trừ điểm thưởng của từng khách hàng.

---

## 3. Hệ Thống Backend RESTful API

| Method | Endpoint | Mô tả | Quyền truy cập |
|---|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký tài khoản khách hàng mới vào SQL | Public |
| `POST` | `/api/auth/login` | Đăng nhập tài khoản & nhận JWT Token | Public |
| `GET` | `/api/auth/me` | Lấy thông tin tài khoản hiện tại | Bearer Token |
| `PUT` | `/api/auth/profile` | Cập nhật họ tên, SĐT, avatar, chi nhánh yêu thích | Bearer Token |
| `PUT` | `/api/auth/password` | Đổi mật khẩu tài khoản | Bearer Token |
| `POST` | `/api/auth/redeem-points` | Đổi điểm thưởng thành voucher giảm giá | Bearer Token |
| `GET` | `/api/menu` | Lấy toàn bộ thực đơn 32 món (hỗ trợ lọc category, search) | Public |
| `GET` | `/api/menu/:id` | Xem chi tiết 1 món ăn/thức uống | Public |
| `POST` | `/api/menu` | Thêm món mới vào thực đơn SQL | Admin / Barista |
| `GET` | `/api/orders` | Lấy lịch sử đơn hàng của người dùng đăng nhập | Bearer Token |
| `POST` | `/api/orders` | Tạo đơn hàng mới và lưu chi tiết vào SQL | Public / Auth |
| `PUT` | `/api/orders/:id/status`| Cập nhật trạng thái pha chế đơn hàng | Public / Barista |
| `GET` | `/api/branches` | Lấy danh sách chi nhánh quầy Barista | Public |
| `GET` | `/api/vouchers` | Lấy danh sách phiếu ưu đãi | Public |
| `GET` | `/api/health` | Kiểm tra tình trạng hoạt động của Server | Public |

---

## 4. Hướng Dẫn Cấu Hình Kết Nối SQL (`.env`)

Ứng dụng hỗ trợ cơ chế linh hoạt **Dual-Engine Database**:

### Cách 1: Chạy ngay với SQLite nhúng (Zero-Config)
Nếu không thiết lập biến môi trường cơ sở dữ liệu, server sẽ tự động sử dụng **SQLite nhúng (`sql.js`)** lưu trữ bền vững tại file `data/app.db`. File `schema.sql` sẽ tự động được thực thi để nạp toàn bộ cấu trúc bảng và 32 món thực đơn ngay lần đầu khởi động.

### Cách 2: Kết nối PostgreSQL ngoài (Production)
Tạo file `.env` tại thư mục gốc dự án và điền chuỗi kết nối:

```env
# Chuỗi kết nối PostgreSQL dạng URL:
DATABASE_URL="postgresql://postgres:mat_khau_cua_ban@localhost:5432/brewlite"

# Hoặc từng thông số riêng lẻ:
SQL_HOST="localhost"
SQL_PORT="5432"
SQL_DB_NAME="brewlite"
SQL_USER="postgres"
SQL_PASSWORD="mat_khau_cua_ban"

# Khóa bí mật bảo mật cho JWT:
JWT_SECRET="chuoi_bi_mat_rat_dai_va_an_toan_2026"
```

Khi có biến môi trường trên, `server/db.ts` sẽ tự động kết nối qua `pg.Pool`, tự kiểm tra và đồng bộ cấu trúc bảng từ `schema.sql`.

---

## 5. Khởi Chạy Dự Án

```bash
# Cài đặt thư viện dependencies
npm install

# Khởi chạy Full-Stack Development Server (Express + Vite trên cổng 3000)
npm run dev

# Kiểm tra cú pháp và kiểu dữ liệu TypeScript
npm run lint

# Biên dịch gói Production
npm run build

# Khởi chạy máy chủ Production
npm run start
```
