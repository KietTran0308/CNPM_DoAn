-- =====================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU SQL SẢN PHẨM & ĐƠN HÀNG (BREW LITE DATABASE)
-- Tương thích tiêu chuẩn ANSI SQL / PostgreSQL / SQLite
-- =====================================================================

-- 1. BẢNG NGƯỜI DÙNG / KHÁCH HÀNG (USERS & CUSTOMERS)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar TEXT,
    membership_tier VARCHAR(50) DEFAULT 'Standard',
    loyalty_points INTEGER DEFAULT 0,
    favorite_branch VARCHAR(255) DEFAULT 'Brew Lite Nhà Thờ - 12 Nhà Thờ, Hoàn Kiếm, HN',
    role VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG DANH MỤC & MÓN ĂN / THỨC UỐNG (MENU ITEMS)
CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    section_caption TEXT,
    description TEXT NOT NULL,
    base_price INTEGER NOT NULL,
    image TEXT NOT NULL,
    is_popular BOOLEAN DEFAULT 0,
    calories INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG CHI NHÁNH QUÁN (BRANCHES)
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    counter VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    open_hours VARCHAR(100) NOT NULL,
    distance VARCHAR(50)
);

-- 4. BẢNG MÃ GIẢM GIÁ / ƯU ĐÃI (VOUCHERS)
CREATE TABLE IF NOT EXISTS vouchers (
    code VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    discount_amount INTEGER NOT NULL,
    min_order INTEGER NOT NULL,
    description TEXT,
    tag VARCHAR(50),
    expiry VARCHAR(50),
    required_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1
);

-- 5. BẢNG ĐƠN HÀNG GIAO DỊCH (ORDERS)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    order_number VARCHAR(64) NOT NULL UNIQUE,
    user_id VARCHAR(64) NOT NULL,
    pickup_code VARCHAR(32) NOT NULL,
    subtotal INTEGER NOT NULL,
    discount INTEGER DEFAULT 0,
    points_discount INTEGER DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    voucher_code VARCHAR(50),
    total INTEGER NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    pickup_branch VARCHAR(255) NOT NULL,
    pickup_counter VARCHAR(100) NOT NULL,
    pickup_time_type VARCHAR(20) NOT NULL,
    scheduled_time VARCHAR(50),
    pickup_note TEXT,
    estimated_minutes INTEGER DEFAULT 15,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. BẢNG CHI TIẾT MÓN TRONG ĐƠN HÀNG (ORDER ITEMS)
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    product_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image TEXT NOT NULL,
    size_id VARCHAR(10) NOT NULL,
    size_name VARCHAR(50) NOT NULL,
    ice_level VARCHAR(20) NOT NULL,
    sugar_level VARCHAR(20) NOT NULL,
    note TEXT,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    toppings_json TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 7. BẢNG LỊCH SỬ TÍCH / TIÊU ĐIỂM THƯỞNG (LOYALTY HISTORY)
CREATE TABLE IF NOT EXISTS loyalty_history (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    order_id VARCHAR(64),
    action VARCHAR(20) NOT NULL,
    points INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- NẠP DỮ LIỆU GỐC THỰC ĐƠN (SEED DATA: 32 MÓN ĂN & THỨC UỐNG CHUẨN)
-- =====================================================================

-- Danh mục A: Cà phê Việt Nam (8 món)
INSERT INTO menu_items (id, name, category, category_name, section_caption, description, base_price, image, is_popular, calories)
VALUES
('vn-1', 'Cà Phê Đen Đá', 'coffee_viet', 'Cà phê Việt Nam', 'PHIN TRUYỀN THỐNG ĐẬM ĐÀ', 'Pha phin truyền thống từ 100% hạt Robusta Buôn Ma Thuột rang mộc, vị đắng thanh, thơm nồng hậu ngọt sảng khoái.', 25000, '/src/assets/images/regenerated_image_1792133944510.png', 1, 12),
('vn-2', 'Cà Phê Sữa Đá', 'coffee_viet', 'Cà phê Việt Nam', 'QUỐC HỒN QUỐC TÚY SÀI GÒN', 'Cà phê phin đậm chất Sài Gòn hòa cùng sữa đặc béo ngậy, vị đắng ngọt hài hòa bừng tỉnh năng lượng ngày mới.', 29000, '/src/assets/images/regenerated_image_1792133994281.png', 1, 145),
('vn-3', 'Bạc Xỉu Đá', 'coffee_viet', 'Cà phê Việt Nam', 'NHIỀU SỮA ÍT CÀ PHÊ', 'Nhiều sữa tươi thanh trùng và sữa đặc béo thơm ngậy, điểm xuyết thêm lớp cà phê phin nhẹ nhàng thanh thoát.', 32000, 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=700&auto=format&fit=crop&q=85', 1, 165),
('vn-4', 'Cà Phê Đen Nóng', 'coffee_viet', 'Cà phê Việt Nam', 'HƯƠNG MỘC TINH KHIẾT', 'Chiết xuất giọt phin nguyên chất ấm áp, giữ trọn hương cà phê mộc Tây Nguyên tinh khiết và hậu vị ngọt sâu.', 25000, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&auto=format&fit=crop&q=85', 0, 8),
('vn-5', 'Cà Phê Sữa Nóng', 'coffee_viet', 'Cà phê Việt Nam', 'ẤM ÁP TỪNG GIỌT PHIN', 'Vị béo ngọt ấm áp của sữa đặc sữa tươi hòa quyện cùng cốt cà phê Robusta rang mộc thơm lừng.', 29000, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=700&auto=format&fit=crop&q=85', 0, 140),
('vn-6', 'Cà Phê Muối Xứ Huế', 'coffee_viet', 'Cà phê Việt Nam', 'KEM MUỐI BÉO MẶN ĐỘC ĐÁO', 'Cà phê phin truyền thống phối lớp kem muối biển sánh mịn, hậu vị mặn nhẹ béo ngậy làm dịu đi vị đắng đặc trưng.', 35000, '/src/assets/images/regenerated_image_1792133906254.png', 1, 180),
('vn-7', 'Cà Phê Cốt Dừa Đá Xay', 'coffee_viet', 'Cà phê Việt Nam', 'CỐT DỪA BẾN TRE BÉO NGẬY', 'Cà phê đen đắng nhẹ quyện cùng cốt dừa tươi Bến Tre xay tuyết mát lạnh, thơm béo khó cưỡng.', 39000, '/src/assets/images/regenerated_image_1792134058079.png', 1, 210),
('vn-8', 'Cà Phê Trứng Hà Nội', 'coffee_viet', 'Cà phê Việt Nam', 'KEM TRỨNG BÔNG MỊN THỦ ĐÔ', 'Lớp kem lòng đỏ trứng gà đánh bông vàng óng mềm mịn phủ trên tách cà phê phin nóng hổi thơm phức.', 42000, '/src/assets/images/regenerated_image_1792134111737.png', 1, 220);

-- Danh mục B: Cà phê pha máy (6 món)
INSERT INTO menu_items (id, name, category, category_name, section_caption, description, base_price, image, is_popular, calories)
VALUES
('mc-1', 'Espresso Arabica Cầu Đất', 'coffee_machine', 'Cà phê pha máy', 'ĐẬM HƯƠNG HẠT VÙNG CAO', 'Shot đơn nguyên chất ép áp suất cao từ hạt Arabica Cầu Đất cao nguyên, lớp crema vàng dày mịn màng.', 30000, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=700&auto=format&fit=crop&q=85', 0, 5),
('mc-2', 'Americano (Đá / Nóng)', 'coffee_machine', 'Cà phê pha máy', 'THANH KHIẾT DỄ UỐNG', 'Hai shot Espresso tươi phối cùng nước tinh khiết, êm dịu thanh nhẹ, giữ tỉnh táo suốt cả ngày làm việc.', 35000, 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=700&auto=format&fit=crop&q=85', 1, 15),
('mc-3', 'Caffe Latte Thanh Trùng', 'coffee_machine', 'Cà phê pha máy', 'MICRO-FOAM MƯỢT MÀ', 'Espresso Arabica thơm lừng kết hợp sữa tươi thanh trùng đánh nóng tạo lớp bọt sữa vi bọt béo mịn nghệ thuật.', 45000, 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=700&auto=format&fit=crop&q=85', 1, 160),
('mc-4', 'Cappuccino Cacao Nồng Nàn', 'coffee_machine', 'Cà phê pha máy', 'BỌT SỮA BÔNG XỐP KINH ĐIỂN', 'Cân bằng kinh điển giữa 1/3 espresso, 1/3 sữa nóng thanh trùng và 1/3 bọt sữa bồng bềnh rắc bột cacao Bỉ.', 45000, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=700&auto=format&fit=crop&q=85', 0, 150),
('mc-5', 'Caramel Macchiato Béo Ngọt', 'coffee_machine', 'Cà phê pha máy', 'SỐT CARAMEL NẤU THỦ CÔNG', 'Sữa tươi đánh nóng đượm hương vani, đánh thức vị giác bởi lớp espresso rót tầng và sốt caramel vân lưới ngọt ngào.', 49000, 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=700&auto=format&fit=crop&q=85', 1, 220),
('mc-6', 'Caffe Mocha Socola Đậm Đà', 'coffee_machine', 'Cà phê pha máy', 'SOCOLA NGUYÊN CHẤT & ESPRESSO', 'Sự hòa quyện tuyệt vời giữa sốt socola đen nguyên chất, shot espresso thơm nồng và sữa tươi béo ngậy.', 48000, 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=700&auto=format&fit=crop&q=85', 0, 230);

-- Danh mục C: Trà & Trà sữa (6 món)
INSERT INTO menu_items (id, name, category, category_name, section_caption, description, base_price, image, is_popular, calories)
VALUES
('tea-1', 'Trà Đào Cam Sả Tươi', 'tea', 'Trà & Trà sữa', 'ĐÀO GIÒN & CAM VÀNG MỌNG NƯỚC', 'Cốt trà đen ủ lạnh ngát hương sả đập dập, phối cùng lát cam vàng tươi mọng nước và miếng đào giòn ngọt sảng khoái.', 39000, '/src/assets/images/regenerated_image_1792134140576.png', 1, 110),
('tea-2', 'Trà Vải Sen Hồng', 'tea', 'Trà & Trà sữa', 'VẢI THIỀU & TRÀ LÀI THANH KHIẾT', 'Trà lài thượng hạng ủ lạnh thơm thanh thoát hòa quyện cùng trái vải thiều căng mọng nước và hạt sen bùi béo.', 42000, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=700&auto=format&fit=crop&q=85', 1, 125),
('tea-3', 'Trà Sen Vàng Long Nhãn', 'tea', 'Trà & Trà sữa', 'HẠT SEN HUẾ & CÙI NHÃN GIÒN', 'Trà ô long thanh dịu kết hợp hạt sen Huế ninh mềm ngọt bùi và cùi long nhãn sấy dẻo giòn ngọt thanh lịch.', 45000, '/src/assets/images/regenerated_image_1792134176034.png', 1, 135),
('tea-4', 'Trà Sữa Truyền Thống Brew Lite', 'tea', 'Trà & Trà sữa', 'TRÂN CHÂU ĐEN DAI DẺO', 'Trà đen đậm đà lá trà Bảo Lộc ủ chậm quyện sữa tươi béo ngọt vừa vặn, đi kèm phần trân châu đen nấu mật ong dai mềm.', 38000, '/src/assets/images/regenerated_image_1792134194526.png', 1, 240),
('tea-5', 'Trà Sữa Ô Long Nướng', 'tea', 'Trà & Trà sữa', 'HƯƠNG KHÓI ĐẬM ĐÀ QUYẾN RŨ', 'Trà ô long sao nướng kỹ lưỡng mang hương khói đặc trưng quyện cùng sữa béo ngậy, đậm đà khó quên.', 42000, '/src/assets/images/regenerated_image_1792134221344.png', 1, 250),
('tea-6', 'Trà Lài Macchiato Kem Cheese', 'tea', 'Trà & Trà sữa', 'KEM PHÔ MAI MẶN BÉO SÁNH MỊN', 'Nước cốt trà hoa lài ngát hương phủ lớp kem phô mai Macchiato mặn béo sánh đặc, tạo tầng hương vị tương phản tuyệt vời.', 45000, '/src/assets/images/regenerated_image_1792134258919.png', 0, 215);

-- Danh mục D: Bánh ngọt & Bánh mì (6 món)
INSERT INTO menu_items (id, name, category, category_name, section_caption, description, base_price, image, is_popular, calories)
VALUES
('bakery-1', 'Croissant Bơ Pháp Nướng Giòn', 'bakery', 'Bánh ngọt & Bánh mì', 'NGÀN LỚP XỐP GIÒN MỖI SÁNG', 'Bánh sừng bò ngàn lớp xốp giòn nướng tươi mỗi sáng, thơm nức mùi bơ lạt Montaigu cao cấp của Pháp.', 32000, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=700&auto=format&fit=crop&q=85', 1, 260),
('bakery-2', 'Bánh Mì Phô Mai Bơ Tỏi Hàn Quốc', 'bakery', 'Bánh ngọt & Bánh mì', 'SỐT BƠ TỎI & CREAM CHEESE', 'Ổ bánh mì vỏ giòn ruột mềm thấm đẫm sốt bơ tỏi thơm nức mũi và lõi phô mai kem cream cheese béo ngậy.', 35000, '/src/assets/images/regenerated_image_1792294148236.png', 1, 320),
('bakery-3', 'Tiramisu Cacao Mềm Mịn', 'bakery', 'Bánh ngọt & Bánh mì', 'PHÔ MAI MASCARPONE & RƯỢU RHUM', 'Bánh quy Savoiardi ngấm đẫm cà phê espresso và chút rượu rhum, xem kẽ lớp kem phô mai Mascarpone mềm mượt rắc bột cacao.', 45000, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=700&auto=format&fit=crop&q=85', 1, 290),
('bakery-4', 'Bánh Tart Phô Mai Hạt Dẻ Nướng', 'bakery', 'Bánh ngọt & Bánh mì', 'PHÔ MAI KEM & HẠT DẺ CARAMEL', 'Cốt bánh tart giòn thơm kết hợp lớp kem phô mai béo mịn, phủ đẫm hạt dẻ rang caramel bùi ngậy và bột đường tuyết.', 42000, '/src/assets/images/regenerated_image_1792134367960.png', 0, 280),
('bakery-5', 'Bánh Cuộn Matcha Hạt Dẻ', 'bakery', 'Bánh ngọt & Bánh mì', 'TRÀ XANH KYOTO & KEM TƯƠI', 'Cốt bánh chiffon matcha Uji mềm ẩm cuộn lớp kem tươi thanh mát và nhân hạt dẻ nướng thơm bùi.', 38000, '/src/assets/images/regenerated_image_1792294144133.png', 0, 250),
('bakery-6', 'Bánh Chuối Nướng Mật Ong Rừng', 'bakery', 'Bánh ngọt & Bánh mì', 'CHUỐI SỨ TÂY NAM BỘ NƯỚNG', 'Chuối sứ chín mùi ướp mật ong rừng và nước cốt dừa nướng vàng ươm, dẻo thơm mang đậm nét dân dã Việt Nam.', 30000, '/src/assets/images/regenerated_image_1792134442588.png', 0, 210);

-- Danh mục E: Kem Gelato thủ công (6 món)
INSERT INTO menu_items (id, name, category, category_name, section_caption, description, base_price, image, is_popular, calories)
VALUES
('ice-1', 'Kem Dừa Non Cốt Dừa Bến Tre', 'ice_cream', 'Kem Gelato thủ công', '100% CỐT DỪA TƯƠI TỰ NHIÊN', 'Chất kem dẻo mịn từ 100% nước cốt dừa tươi nguyên chất xứ Bến Tre, xen lẫn những miếng cơm dừa non sần sật bùi béo.', 35000, '/src/assets/images/regenerated_image_1792134409767.png', 1, 190),
('ice-2', 'Kem Sầu Riêng Ri6 Thượng Hạng', 'ice_cream', 'Kem Gelato thủ công', 'THỊT SẦU RIÊNG RI6 CHÍN CÂY', 'Đậm đặc thịt sầu riêng Ri6 chín vàng thơm lừng nức mũi, chất kem gelato dẻo quánh tự nhiên không hề sử dụng hương liệu.', 42000, '/src/assets/images/regenerated_image_1792134296233.png', 1, 230),
('ice-3', 'Kem Bơ Sáp Đắk Lắk Béo Ngậy', 'ice_cream', 'Kem Gelato thủ công', 'BƠ SÁP TÂY NGUYÊN NGUYÊN CHẤT', 'Trái bơ sáp Đắk Lắk dẻo quánh béo ngậy kết hợp sữa tươi thanh trùng, ngọt thanh mát rượi tan chậm trong vòm họng.', 39000, '/src/assets/images/regenerated_image_1792134328651.png', 1, 210),
('ice-4', 'Kem Matcha Uji Kyoto Nhật Bản', 'ice_cream', 'Kem Gelato thủ công', 'TRÀ XANH NGUYÊN CHẤT NHẬT BẢN', 'Bột trà xanh Uji Kyoto thượng hạng đem lại hương thơm ngát, vị chát thanh ban đầu và hậu ngọt bùi sâu lắng chuẩn phong vị Nhật.', 39000, '/src/assets/images/regenerated_image_1792134475453.png', 0, 185),
('ice-5', 'Kem Socola Bỉ Nguyên Chất 70%', 'ice_cream', 'Kem Gelato thủ công', 'SOCOLA NGUYÊN BẢN ĐẮNG NHẸ', 'Socola đen Bỉ nguyên chất 70% đắng đậm quyến rũ, chất kem gelato dẻo mịn tan chảy mượt mà đầy mê hoặc.', 39000, 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=700&auto=format&fit=crop&q=85', 0, 220),
('ice-6', 'Kem Vani Madagascar Thủ Công', 'ice_cream', 'Kem Gelato thủ công', 'QUẢ VANI MADAGASCAR TỰ NHIÊN', 'Sữa tươi thanh trùng nấu chậm cùng quả vani Madagascar đắt giá, lấm tấm hạt vani đen thơm ngát ngọt dịu thanh tao.', 35000, 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=700&auto=format&fit=crop&q=85', 1, 180);

-- Nạp Chi nhánh
INSERT INTO branches (id, name, short_name, address, counter, phone, open_hours, distance)
VALUES
('b1', 'Brew Lite Nhà Thờ', 'Nhà Thờ', '12 Nhà Thờ, P. Hàng Trống, Hoàn Kiếm, Hà Nội', 'Quầy Pha Chế Tầng 1 - Mặt Tiền', '024 3928 6688', '07:00 - 22:30', '1.2 km'),
('b2', 'Brew Lite Đồng Khởi', 'Đồng Khởi', '88 Đồng Khởi, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh', 'Quầy Express Pickup Cửa Đông', '028 3822 9988', '06:30 - 23:00', '2.5 km'),
('b3', 'Brew Lite Cầu Giấy', 'Cầu Giấy', '241 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội', 'Quầy Bar Trung Tâm', '024 3754 8899', '07:00 - 22:00', '3.8 km');

-- Nạp Mã ưu đãi Vouchers
INSERT INTO vouchers (code, title, discount_amount, min_order, description, tag, expiry, required_points)
VALUES
('BANMOI15', 'Giảm 15.000đ Đơn Đầu Tiên', 15000, 40000, 'Áp dụng cho mọi khách hàng mới đặt món qua ứng dụng', 'Khách Mới', '31/12/2026', 0),
('BREWLITE20', 'Giảm 20.000đ Giờ Vàng 13h-16h', 20000, 60000, 'Nạp năng lượng buổi chiều cùng cà phê & trà sữa', 'Giờ Vàng', '31/12/2026', 0),
('FREESHIP', 'Miễn Phí Ly Kem Gelato', 35000, 100000, 'Tặng ngay 1 ly kem Gelato dừa non cho hóa đơn từ 100K', 'Hot', '31/12/2026', 0),
('VIPDIAMOND', 'Đặc Quyền Hội Viên Kim Cương', 50000, 120000, 'Dành riêng cho hội viên Diamond tích lũy điểm', 'VIP', '31/12/2026', 100);
