BEGIN;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
-- Gia tri thoi gian trong du lieu mau duoc hieu theo UTC (cot da la timestamptz).
SET LOCAL TIME ZONE 'UTC';

CREATE TYPE public.discount_type AS ENUM (
    'PERCENT',
    'FIXED'
);

-- [C] REVERSAL: dao nguoc diem da cong (EARN) hoac hoan diem da dung (REDEEM)
-- khi huy don / hoan tien. Backend quyet dinh chieu cong/tru theo don goc.
CREATE TYPE public.loyalty_type AS ENUM (
    'EARN',
    'REDEEM',
    'REVERSAL'
);

CREATE TYPE public.order_status AS ENUM (
    'PENDING',
    'PAID',
    'PAYMENT_FAILED',
    'PREPARING',
    'READY',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE public.payment_method AS ENUM (
    'WALLET',
    'CARD',
    'VNPAY'
);

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED'
);

CREATE TYPE public.product_size AS ENUM (
    'S',
    'M',
    'L'
);


-- 2. CAC BANG CHUC NANG GOC (bo products.stock)
-- Tat ca cot thoi gian dung timestamptz.
CREATE TABLE public.coupons (
                                id uuid DEFAULT gen_random_uuid() NOT NULL,
                                code character varying(50) NOT NULL,
                                discount_type public.discount_type NOT NULL,
                                discount_value numeric(12,2) NOT NULL,
                                min_order_value numeric(12,2) DEFAULT 0 NOT NULL,
                                max_uses integer NOT NULL,
                                used_count integer DEFAULT 0 NOT NULL,
                                is_active boolean DEFAULT true NOT NULL,
                                valid_from timestamptz NOT NULL,
                                valid_to timestamptz NOT NULL,
                                CONSTRAINT chk_coupons_dates CHECK ((valid_to > valid_from)),
                                CONSTRAINT chk_coupons_discount CHECK ((((discount_type = 'PERCENT'::public.discount_type) AND (discount_value > (0)::numeric) AND (discount_value <= (100)::numeric)) OR ((discount_type = 'FIXED'::public.discount_type) AND (discount_value > (0)::numeric)))),
                                CONSTRAINT chk_coupons_min_order CHECK ((min_order_value >= (0)::numeric)),
                                CONSTRAINT chk_coupons_uses CHECK (((max_uses > 0) AND (used_count >= 0) AND (used_count <= max_uses)))
);

CREATE TABLE public.loyalty_transactions (
                                             id uuid DEFAULT gen_random_uuid() NOT NULL,
                                             user_id uuid NOT NULL,
                                             order_id uuid,
                                             points integer NOT NULL,
                                             transaction_type public.loyalty_type NOT NULL,
                                             reverses_transaction_id uuid,
                                             created_at timestamptz DEFAULT now() NOT NULL,
                                             CONSTRAINT chk_loyalty_points_positive CHECK (points > 0),
                                             CONSTRAINT chk_loyalty_reversal_reference CHECK (
                                                 (transaction_type = 'REVERSAL' AND reverses_transaction_id IS NOT NULL)
                                                     OR (transaction_type <> 'REVERSAL' AND reverses_transaction_id IS NULL)
                                                 ),
    -- Giao dich REVERSAL khong duoc tu hoan tac chinh no.
                                             CONSTRAINT chk_loyalty_not_self_reverse CHECK (
                                                 reverses_transaction_id IS DISTINCT FROM id
)
    );

CREATE TABLE public.order_item_toppings (
                                            id uuid DEFAULT gen_random_uuid() NOT NULL,
                                            order_item_id uuid NOT NULL,
                                            topping_id uuid NOT NULL,
                                            unit_price numeric(12,2) NOT NULL,
                                            servings integer NOT NULL DEFAULT 1,
                                            CONSTRAINT chk_oit_unit_price CHECK (unit_price >= 0),
                                            CONSTRAINT chk_oit_servings CHECK (servings > 0)
);

CREATE TABLE public.order_items (
                                    id uuid DEFAULT gen_random_uuid() NOT NULL,
                                    order_id uuid NOT NULL,
                                    product_id uuid NOT NULL,
                                    size public.product_size NOT NULL,
                                    quantity integer NOT NULL,
                                    base_price numeric(12,2) NOT NULL,
    -- unit_price = base_price + SUM(order_item_toppings.unit_price * servings) cho MOT ly.
                                    unit_price numeric(12,2) NOT NULL,
                                    line_total numeric(12,2) NOT NULL,
                                    sugar varchar(20) NOT NULL DEFAULT '100%',
                                    ice varchar(20) NOT NULL DEFAULT '100%',
                                    note varchar(250),
                                    CONSTRAINT chk_order_items_sugar CHECK (sugar IN ('100%', '70%', '50%', '30%', 'Ít đường')),
                                    CONSTRAINT chk_order_items_ice CHECK (ice IN ('100%', '70%', '50%', 'Ít đá', 'Đá riêng')),
                                    CONSTRAINT chk_order_items_price CHECK (base_price >= 0 AND unit_price >= base_price
                                        AND line_total = unit_price * quantity),
                                    CONSTRAINT chk_order_items_quantity CHECK ((quantity > 0))
);

CREATE TABLE public.order_status_history (
                                             id uuid DEFAULT gen_random_uuid() NOT NULL,
                                             order_id uuid NOT NULL,
                                             from_status public.order_status,
                                             to_status public.order_status NOT NULL,
                                             changed_at timestamptz DEFAULT now() NOT NULL,
                                             CONSTRAINT chk_history_transition_not_same CHECK ((from_status IS DISTINCT FROM to_status))
);

CREATE TABLE public.orders (
                               id uuid DEFAULT gen_random_uuid() NOT NULL,
                               order_code integer NOT NULL,
                               user_id uuid NOT NULL,
                               coupon_id uuid,
                               status public.order_status DEFAULT 'PENDING'::public.order_status NOT NULL,
                               subtotal numeric(12,2) NOT NULL,
                               discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
                               points_used integer DEFAULT 0 NOT NULL,
                               points_discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
                               total numeric(12,2) NOT NULL,
                               expires_at timestamptz DEFAULT (now() + '00:20:00'::interval) NOT NULL,
                               created_at timestamptz DEFAULT now() NOT NULL,
                               updated_at timestamptz DEFAULT now() NOT NULL,
                               idempotency_key character varying(128),
                               request_hash character varying(64),
                               CONSTRAINT chk_orders_amounts CHECK (((subtotal >= (0)::numeric) AND (discount_amount >= (0)::numeric) AND (points_used >= 0) AND (points_discount_amount >= (0)::numeric) AND (total >= (0)::numeric) AND ((discount_amount + points_discount_amount) <= subtotal) AND (total = ((subtotal - discount_amount) - points_discount_amount)))),
    -- [B] Khong co coupon thi khong the co tien giam tu coupon.
                               CONSTRAINT chk_orders_coupon_discount CHECK (coupon_id IS NOT NULL OR discount_amount = 0),
                               CONSTRAINT chk_orders_idempotency_pair CHECK (
                                   (idempotency_key IS NULL) = (request_hash IS NULL)
                                   )
);

ALTER TABLE public.orders ALTER COLUMN order_code ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.orders_order_code_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.payments (
                                 id uuid DEFAULT gen_random_uuid() NOT NULL,
                                 order_id uuid NOT NULL,
                                 idempotency_key character varying(128) NOT NULL,
                                 amount numeric(12,2) NOT NULL,
                                 method public.payment_method NOT NULL,
                                 status public.payment_status NOT NULL,
                                 provider_ref character varying(255),
                                 vnp_transaction_no varchar(255),
                                 vnp_response_code varchar(10),
                                 bank_code varchar(50),
                                 paid_at timestamptz,
                                 vnp_create_date varchar(14),
                                 vnp_ip_addr varchar(45),
    -- Hoan tien mo phong: 0 neu chua hoan, so tien da hoan neu co.
                                 refunded_amount numeric(12,2) NOT NULL DEFAULT 0,
                                 refunded_at timestamptz,
                                 created_at timestamptz DEFAULT now() NOT NULL,
                                 CONSTRAINT chk_payments_amount CHECK ((amount >= (0)::numeric)),
                                 CONSTRAINT chk_payments_idempotency CHECK (((length(btrim((idempotency_key)::text)) >= 8) AND (length(btrim((idempotency_key)::text)) <= 128))),
    -- [B] 0 <= refunded_amount <= amount; refunded_at co gia tri khi va chi khi da hoan tien.
                                 CONSTRAINT chk_payments_refund CHECK (
                                     refunded_amount >= 0 AND refunded_amount <= amount
                                         AND ((refunded_amount = 0 AND refunded_at IS NULL)
                                         OR (refunded_amount > 0 AND refunded_at IS NOT NULL))
                                     ),
    -- Chi giao dich thanh toan thanh cong moi co the duoc hoan tien.
                                 CONSTRAINT chk_payments_refund_only_success CHECK (
                                     refunded_amount = 0 OR status = 'SUCCESS'
                                     )
);

-- Bang GIA BAN duy nhat theo tung san pham va size (khong dung products.price).
CREATE TABLE public.product_size_prices (
                                            product_id uuid NOT NULL,
                                            size public.product_size NOT NULL,
                                            price numeric(12,2) NOT NULL,
                                            CONSTRAINT chk_product_size_prices_price CHECK ((price >= (0)::numeric))
);

CREATE TABLE public.products (
                                 id uuid DEFAULT gen_random_uuid() NOT NULL,
                                 code character varying(50) NOT NULL,
                                 name character varying(255) NOT NULL,
                                 category character varying(50) NOT NULL,
                                 description character varying(1000),
    -- Khong co cot price: gia ban duoc xac dinh theo product_size_prices.
                                 image_url character varying(500),
                                 image_key character varying(100),
                                 version integer DEFAULT 0 NOT NULL,
                                 is_active boolean DEFAULT true NOT NULL,
                                 CONSTRAINT chk_products_code CHECK (length(btrim(code)) > 0),
                                 CONSTRAINT chk_products_category CHECK (length(btrim(category)) > 0),
                                 CONSTRAINT chk_products_version CHECK ((version >= 0))
);

CREATE TABLE public.toppings (
                                 id uuid DEFAULT gen_random_uuid() NOT NULL,
                                 code character varying(20) NOT NULL,
                                 name character varying(255) NOT NULL,
                                 price numeric(12,2) NOT NULL,
                                 is_active boolean DEFAULT true NOT NULL,
                                 CONSTRAINT chk_toppings_price CHECK ((price >= (0)::numeric))
);

CREATE TABLE public.user_vouchers (
                                      id uuid DEFAULT gen_random_uuid() NOT NULL,
                                      user_id uuid NOT NULL,
                                      coupon_id uuid NOT NULL,
                                      reward_id character varying(30) NOT NULL,
                                      request_id uuid NOT NULL,
                                      created_at timestamptz DEFAULT now() NOT NULL,
                                      used_at timestamptz,
    -- Don hang ma voucher duoc su dung (NULL neu chua su dung).
                                      used_order_id uuid,
    -- [B] used_at va used_order_id phai cung NULL hoac cung co gia tri.
                                      CONSTRAINT chk_uv_used CHECK ((used_at IS NULL) = (used_order_id IS NULL))
);

CREATE TABLE public.users (
                              id uuid DEFAULT gen_random_uuid() NOT NULL,
                              email character varying(255) NOT NULL,
                              password_hash character varying(255) NOT NULL,
                              full_name character varying(255) NOT NULL,
                              phone character varying(20),
                              role character varying(16) DEFAULT 'CUSTOMER'::character varying NOT NULL,
                              loyalty_points integer DEFAULT 0 NOT NULL,
                              loyalty_debt integer DEFAULT 0 NOT NULL CHECK (loyalty_debt >= 0),
                              created_at timestamptz DEFAULT now() NOT NULL,
                              avatar_url character varying(500),
                              favorite_branch character varying(255),
                              CONSTRAINT chk_users_fullname CHECK ((length(btrim((full_name)::text)) >= 2)),
                              CONSTRAINT chk_users_loyalty CHECK ((loyalty_points >= 0)),
                              CONSTRAINT chk_users_role CHECK (((role)::text = ANY (ARRAY[('CUSTOMER'::character varying)::text, ('STAFF'::character varying)::text, ('ADMIN'::character varying)::text])))
);


-- 3. KHOA / CHI MUC / QUAN HE GOC
ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.order_item_toppings
    ADD CONSTRAINT order_item_toppings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key UNIQUE (order_code);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_idempotency_key UNIQUE (idempotency_key);

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_size_prices
    ADD CONSTRAINT product_size_prices_pkey PRIMARY KEY (product_id, size);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.toppings
    ADD CONSTRAINT toppings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.order_item_toppings
    ADD CONSTRAINT uq_order_item_topping UNIQUE (order_item_id, topping_id);

-- Moi user giu toi da 1 voucher cho 1 coupon; nhieu user van dung chung 1 coupon.
ALTER TABLE ONLY public.user_vouchers
    ADD CONSTRAINT uq_user_vouchers_user_coupon UNIQUE (user_id, coupon_id);

ALTER TABLE ONLY public.user_vouchers
    ADD CONSTRAINT user_vouchers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_vouchers
    ADD CONSTRAINT user_vouchers_request_id_key UNIQUE (request_id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

CREATE INDEX idx_loyalty_user ON public.loyalty_transactions USING btree (user_id);

CREATE INDEX idx_oit_order_item ON public.order_item_toppings USING btree (order_item_id);

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);

CREATE INDEX idx_order_items_product ON public.order_items USING btree (product_id);

CREATE INDEX idx_orders_coupon ON public.orders USING btree (coupon_id);

CREATE INDEX idx_orders_status ON public.orders USING btree (status);

CREATE INDEX idx_orders_user_created ON public.orders USING btree (user_id, created_at);

CREATE INDEX idx_payments_order ON public.payments USING btree (order_id);

CREATE INDEX idx_status_history_order ON public.order_status_history USING btree (order_id);

CREATE INDEX idx_user_vouchers_user ON public.user_vouchers USING btree (user_id);
-- 1 don hang chi co the su dung toi da 1 voucher, khop orders.coupon_id.
CREATE UNIQUE INDEX ux_user_vouchers_used_order ON public.user_vouchers (used_order_id)
    WHERE used_order_id IS NOT NULL;

CREATE UNIQUE INDEX ux_orders_idempotency_key ON public.orders USING btree (idempotency_key);

-- Mot lan EARN va mot lan REDEEM cho moi don; REVERSAL theo giao dich goc.
CREATE UNIQUE INDEX ux_loyalty_order_transaction_type ON public.loyalty_transactions (order_id, transaction_type)
    WHERE order_id IS NOT NULL AND transaction_type IN ('EARN', 'REDEEM');
CREATE UNIQUE INDEX ux_loyalty_reversal_origin ON public.loyalty_transactions (reverses_transaction_id)
    WHERE reverses_transaction_id IS NOT NULL;

CREATE UNIQUE INDEX ux_payments_provider_ref ON public.payments(provider_ref);
CREATE UNIQUE INDEX ux_payments_one_pending_vnpay_per_order ON public.payments(order_id)
    WHERE method = 'VNPAY' AND status = 'PENDING';
CREATE UNIQUE INDEX ux_payments_one_success_per_order ON public.payments USING btree (order_id) WHERE (status = 'SUCCESS'::public.payment_status);

CREATE UNIQUE INDEX ux_products_code ON public.products USING btree (code);
CREATE UNIQUE INDEX ux_products_image_key ON public.products USING btree (image_key);

CREATE UNIQUE INDEX ux_toppings_code ON public.toppings USING btree (code);

-- Email khong phan biet hoa thuong: Abc@x.com va abc@x.com la cung 1 tai khoan.
-- Van nen chuan hoa email ve chu thuong o backend truoc khi luu.
CREATE UNIQUE INDEX ux_users_email_lower ON public.users USING btree (lower(email));



ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fk_order_items_valid_size FOREIGN KEY (product_id, size) REFERENCES public.product_size_prices(product_id, size);

ALTER TABLE ONLY public.user_vouchers
    ADD CONSTRAINT fk_uv_coupon FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);

ALTER TABLE ONLY public.user_vouchers
    ADD CONSTRAINT fk_uv_user FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.user_vouchers
    ADD CONSTRAINT fk_uv_used_order FOREIGN KEY (used_order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT fk_loyalty_reverses FOREIGN KEY (reverses_transaction_id)
    REFERENCES public.loyalty_transactions(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT fk_loyalty_order FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT fk_loyalty_user FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.order_item_toppings
    ADD CONSTRAINT fk_oit_order_item FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.order_item_toppings
    ADD CONSTRAINT fk_oit_topping FOREIGN KEY (topping_id) REFERENCES public.toppings(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.product_size_prices
    ADD CONSTRAINT fk_psp_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


-- 4. CAC BANG TON KHO NGUYEN VAT LIEU
CREATE TABLE public.ingredients (
                                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                                    code varchar(30) NOT NULL UNIQUE,
                                    name varchar(255) NOT NULL,
                                    unit varchar(10) NOT NULL CHECK (unit IN ('g', 'ml', 'cai')),
                                    stock_quantity numeric(14,3) NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
                                    min_stock_quantity numeric(14,3) NOT NULL DEFAULT 0 CHECK (min_stock_quantity >= 0),
    -- Optimistic locking: backend tang version khi cap nhat ton kho.
                                    version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
                                    is_active boolean NOT NULL DEFAULT true,
                                    updated_at timestamptz NOT NULL DEFAULT now()
);

-- How much of each ingredient a SINGLE drink of each size requires.
CREATE TABLE public.product_ingredients (
                                            product_id uuid NOT NULL,
                                            size public.product_size NOT NULL,
                                            ingredient_id uuid NOT NULL,
                                            quantity numeric(14,3) NOT NULL CHECK (quantity > 0),
                                            PRIMARY KEY (product_id, size, ingredient_id),
                                            CONSTRAINT fk_recipe_product_size FOREIGN KEY (product_id, size)
                                                REFERENCES public.product_size_prices(product_id, size) ON DELETE CASCADE,
                                            CONSTRAINT fk_recipe_ingredient FOREIGN KEY (ingredient_id)
                                                REFERENCES public.ingredients(id)
);

-- One topping added to one drink: ingredient quantities are specified here.
CREATE TABLE public.topping_ingredients (
                                            topping_id uuid NOT NULL,
                                            ingredient_id uuid NOT NULL,
                                            quantity numeric(14,3) NOT NULL CHECK (quantity > 0),
                                            PRIMARY KEY (topping_id, ingredient_id),
                                            CONSTRAINT fk_topping_recipe_topping FOREIGN KEY (topping_id)
                                                REFERENCES public.toppings(id) ON DELETE CASCADE,
                                            CONSTRAINT fk_topping_recipe_ingredient FOREIGN KEY (ingredient_id)
                                                REFERENCES public.ingredients(id)
);

-- CONSUMPTION: ghi so nguyen lieu DA TRU KHO theo don thanh toan thanh cong.
-- Theo phuong an 2, tru kho truoc khi xac nhan thanh toan SUCCESS/PAID,
-- nhung PHAI NAM TRONG CUNG DB TRANSACTION voi cap nhat payment/order.
-- Khong tru kho lan 2 o PREPARING; don PENDING chua tru kho.
-- So luong ban (order_items.quantity) khac voi so luong nguyen lieu.
CREATE TABLE public.ingredient_movements (
                                             id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                                             ingredient_id uuid NOT NULL REFERENCES public.ingredients(id),
                                             order_id uuid REFERENCES public.orders(id) ON DELETE RESTRICT,
    -- Nhan vien thuc hien; NULL khi tao ton dau ky hoac buoc he thong tu dong.
                                             performed_by uuid REFERENCES public.users(id),
                                             movement_type varchar(20) NOT NULL
                                                 CHECK (movement_type IN ('OPENING','RESTOCK','CONSUMPTION','WASTE','ADJUST')),
    -- Version da doc truoc khi backend UPDATE ton kho; luu de truy vet optimistic locking.
                                             expected_version integer NOT NULL CHECK (expected_version >= 0),
                                             quantity_change numeric(14,3) NOT NULL CHECK (quantity_change <> 0),
                                             stock_before numeric(14,3) NOT NULL CHECK (stock_before >= 0),
                                             stock_after numeric(14,3) NOT NULL CHECK (stock_after >= 0),
                                             note text,
                                             created_at timestamptz NOT NULL DEFAULT now(),
                                             CONSTRAINT chk_movement_balance
                                                 CHECK (stock_after = stock_before + quantity_change),
                                             CONSTRAINT chk_movement_direction CHECK (
                                                 (movement_type IN ('OPENING','RESTOCK') AND quantity_change > 0)
                                                     OR (movement_type IN ('CONSUMPTION','WASTE') AND quantity_change < 0)
                                                     OR (movement_type = 'ADJUST')
                                                 ),
                                             CONSTRAINT chk_movement_order_ref CHECK (
                                                 movement_type <> 'CONSUMPTION' OR order_id IS NOT NULL
                                                 )
);


-- 5. CHI MUC QUAN LY NGUYEN VAT LIEU
CREATE INDEX idx_recipe_ingredient ON public.product_ingredients(ingredient_id);
CREATE INDEX idx_topping_recipe_ingredient ON public.topping_ingredients(ingredient_id);
CREATE INDEX idx_movements_ingredient_date ON public.ingredient_movements(ingredient_id, created_at);
CREATE INDEX idx_movements_order ON public.ingredient_movements(order_id);
CREATE INDEX idx_movements_performed_by ON public.ingredient_movements(performed_by);
CREATE UNIQUE INDEX ux_one_consumption_per_ingredient_order
    ON public.ingredient_movements(order_id, ingredient_id)
    WHERE movement_type = 'CONSUMPTION' AND order_id IS NOT NULL;
CREATE UNIQUE INDEX ux_one_opening_per_ingredient
    ON public.ingredient_movements(ingredient_id) WHERE movement_type = 'OPENING';

INSERT INTO public.coupons (id, code, discount_type, discount_value, min_order_value, max_uses, used_count, is_active, valid_from, valid_to) VALUES
                                                                                                                                                 ('adbbacc5-1334-51f8-8f49-0804c79ef130', 'WELCOME10', 'PERCENT', '10.00', '30000.00', '100', '0', 't', '2026-07-27 17:57:02.446613', '2027-12-31 16:59:59'),
                                                                                                                                                 ('653cb812-382c-5f3f-ab46-644a131aca3b', 'FREESHIP5', 'FIXED', '5000.00', '35000.00', '120', '0', 't', '2026-07-27 17:57:02.446613', '2027-12-31 16:59:59'),
                                                                                                                                                 ('9db61425-bfe9-5a73-aff5-36afc90c654c', 'GIAM10K', 'FIXED', '10000.00', '70000.00', '80', '0', 't', '2026-07-27 17:57:02.446613', '2027-12-31 16:59:59'),
                                                                                                                                                 ('b2819e57-731d-589f-9502-160dd1f685a7', 'CAFE20', 'PERCENT', '20.00', '90000.00', '50', '0', 't', '2026-07-27 17:57:02.446613', '2027-12-31 16:59:59'),
                                                                                                                                                 ('05e690cc-5779-51ea-8363-0e9a810ea085', 'LOYA5K', 'FIXED', '5000.00', '45000.00', '100', '0', 't', '2026-07-27 17:57:02.446613', '2027-12-31 16:59:59'),
                                                                                                                                                 ('352c856d-4fdf-501c-8770-41ab24a770a6', 'EXPIRED10', 'PERCENT', '10.00', '30000.00', '15', '0', 't', '2026-07-27 17:57:02.446613', '2026-10-20 17:57:02.446613'),
                                                                                                                                                 ('9121ba0a-9f7f-5381-a190-048874304192', 'INACTIVE5', 'FIXED', '5000.00', '40000.00', '20', '0', 'f', '2026-08-26 17:57:02.446613', '2027-12-31 16:59:59'),
                                                                                                                                                 ('804ee787-75a6-539c-9d39-83bb8853f413', 'BREWLITE15', 'PERCENT', '15.00', '60000.00', '80', '0', 't', '2026-07-27 17:57:02.446613', '2027-12-31 16:59:59');

INSERT INTO public.toppings (id, code, name, price, is_active) VALUES
                                                                   ('3075f104-4b54-59d0-a5af-0d8fa3ab2828', 'TP001', 'Trân châu đen', '5000.00', 't'),
                                                                   ('4d4dca18-ae47-5485-ab6b-b5e74f089b74', 'TP002', 'Trân châu trắng', '6000.00', 't'),
                                                                   ('ca461442-fc58-596a-a78a-e4b938fbaab7', 'TP003', 'Thạch cà phê', '5000.00', 't'),
                                                                   ('be4d54f5-a987-5306-960f-632909bdac15', 'TP004', 'Kem cheese', '9000.00', 't'),
                                                                   ('3fa12143-595b-5f18-aabd-56a4882f0924', 'TP005', 'Kem tươi', '7000.00', 't'),
                                                                   ('7606cbbf-f31f-5dbd-b3cf-8f9b24036323', 'TP006', 'Trân châu hoàng kim', '7000.00', 't'),
                                                                   ('3655baaf-57e8-57d8-b0df-986345d8002c', 'TP007', 'Thạch đào', '6000.00', 't'),
                                                                   ('46ccd2db-66ca-5514-8ab3-7a0c76e4478e', 'TP008', 'Thạch vải', '6000.00', 't'),
                                                                   ('674c8ede-3830-5c10-963e-4d5fbe129ef4', 'TP009', 'Shot espresso', '10000.00', 't'),
                                                                   ('c5f1343d-f22c-5819-bd08-62a013bfa85e', 'TP010', 'Pudding trứng', '8000.00', 't');

INSERT INTO public.users (id, email, password_hash, full_name, phone, role, loyalty_points, created_at, avatar_url, favorite_branch) VALUES
                                                                                                                                         ('5f15f651-55d0-54af-b402-204a5cdb438e', 'customer04@example.com', '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe', 'Phạm Gia Huy', '0900000004', 'CUSTOMER', '0', '2026-10-13 15:57:02.446613', NULL, NULL),
                                                                                                                                         ('dd2a0246-fc58-59ea-9b22-3edd78488229', 'customer05@example.com', '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe', 'Đỗ Khánh Linh', '0900000005', 'CUSTOMER', '0', '2026-10-13 18:27:02.446613', NULL, NULL),
                                                                                                                                         ('84276309-9cbe-52f3-ba77-c6441210a0b3', 'customer06@example.com', '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe', 'Võ Ngọc Mai', '0900000006', 'CUSTOMER', '0', '2026-10-13 20:57:02.446613', NULL, NULL),
                                                                                                                                         ('56b6874f-e79a-5baa-82bf-742ae9204916', 'customer07@example.com', '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe', 'Bùi Hoàng Nam', '0900000007', 'CUSTOMER', '0', '2026-10-13 23:27:02.446613', NULL, NULL),
                                                                                                                                         ('f6a3fc8e-3153-5f05-9339-b2ce98fdf72f', 'customer08@example.com', '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe', 'Hoàng Thanh Trúc', '0900000008', 'CUSTOMER', '0', '2026-10-14 01:57:02.446613', NULL, NULL),
                                                                                                                                         ('2d9e6949-bbae-547f-b825-e52a448c5841', 'customer09@example.com', '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe', 'Đặng Nhật Minh', '0900000009', 'CUSTOMER', '0', '2026-10-14 04:27:02.446613', NULL, NULL),
                                                                                                                                         ('c5d55341-3044-5b34-92b7-7fac9f607a8e', 'customer10@example.com', '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe', 'Lý Thu Hà', '0900000010', 'CUSTOMER', '0', '2026-10-14 06:57:02.446613', NULL, NULL),
                                                                                                                                         ('42a057e6-3fac-59a9-95ef-578d09bdf43b', 'barista01@example.com', '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe', 'Nhân viên Quầy 01', '0900000011', 'STAFF', '0', '2026-10-14 09:27:02.446613', NULL, NULL),
                                                                                                                                         ('305ebe46-9a84-5923-a736-df0a01191b58', 'admin01@example.com', '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe', 'Quản trị BrewLite', '0900000012', 'ADMIN', '0', '2026-10-14 11:57:02.446613', NULL, NULL),
                                                                                                                                         ('0abd345f-7157-5376-bdf7-d23459d5c505', 'customer01@example.com', '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe', 'Nguyễn Minh Anh', '0900000001', 'CUSTOMER', '0', '2026-10-08 17:57:02.446613', NULL, NULL),
                                                                                                                                         ('fd59e87d-6638-5681-9acd-cf19dd4fe755', 'customer03@example.com', '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe', 'Lê Thảo Vy', '0900000003', 'CUSTOMER', '0', '2026-10-11 17:57:02.446613', NULL, NULL),
                                                                                                                                         ('89094c8e-81d2-582b-adcc-b81a331c6684', 'customer02@example.com', '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe', 'Trần Quốc Bảo', '0900000002', 'CUSTOMER', '0', '2026-10-10 17:57:02.446613', NULL, NULL);

-- image_key la ma anh local (duoc frontend map sang asset), KHONG PHAI URL.
-- image_url dang NULL; neu UI su dung URL thay vi image_key thi can cap nhat truoc demo.
INSERT INTO public.products (id, code, name, category, description, image_url, image_key, version, is_active) VALUES
                                                                                                                  ('c2109f91-894f-5836-872b-fc4c0f04ca5d', 'BL001', 'Cà phê sữa', 'Cà phê', 'Cà phê Robusta đậm đà pha sữa đặc thơm béo truyền thống', NULL, 'caPheSua', 0, TRUE),
                                                                                                                  ('80976789-a56b-5b36-88ba-04cd171910d6', 'BL002', 'Americano', 'Cà phê', 'Cà phê đen nguyên chất pha loãng với nước nóng thanh tao', NULL, 'americano', 0, TRUE),
                                                                                                                  ('0f5dda15-68ab-5ca9-aa9a-eb7dc73894d0', 'BL003', 'Cappuccino', 'Cà phê', 'Espresso đậm vị kết hợp sữa nóng và lớp bọt sữa bồng bềnh', NULL, 'cappuccino', 0, TRUE),
                                                                                                                  ('5f6a5f28-990d-585f-890a-4182e8664384', 'BL004', 'Trà đào', 'Trà', 'Trà thanh mát kết hợp đào miếng tươi giòn ngọt lịm', NULL, 'traDao', 0, TRUE),
                                                                                                                  ('4c1c6d0a-0b99-5c97-b5ba-ac3a55b06479', 'BL005', 'Cà Phê Muối Huế', 'Cà phê', 'Cà phê phin đậm đà kết hợp lớp kem muối mặn ngọt béo ngậy chuẩn vị cố đô', NULL, 'caPheMuoi', 0, TRUE),
                                                                                                                  ('4f132288-30ec-529d-b40a-80d49fbdc751', 'BL006', 'Cà Phê Trứng Hà Nội', 'Cà phê', 'Lớp kem trứng gà đánh bông mịn màng, thơm lừng hòa quyện cùng cà phê nóng', NULL, 'caPheTrung', 0, TRUE),
                                                                                                                  ('f05fbd26-e12a-5870-83fe-01820d68bdba', 'BL007', 'Bạc Xỉu Đá Sài Gòn', 'Cà phê', 'Sữa đặc pha sữa tươi béo ngậy tạo tầng đẹp mắt cùng cà phê phin thơm nhẹ', NULL, 'bacXiu', 0, TRUE),
                                                                                                                  ('4e565d14-f3ab-5ad5-8577-6e657a55dcf4', 'BL008', 'Cà Phê Cốt Dừa', 'Cà phê', 'Cốt dừa xay đá tuyết mát lạnh, béo bùi quyện cùng vị đắng dịu của cà phê', NULL, 'caPheCotDua', 0, TRUE),
                                                                                                                  ('e602a5e6-bfba-57b4-b178-79be1eed5883', 'BL009', 'Cà Phê Sữa Tươi Sương Sáo', 'Cà phê', 'Cà phê sữa tươi thanh nhẹ kết hợp cùng thạch sương sáo đen giòn mát', NULL, 'caPheSuaTuoiSuongSao', 0, TRUE),
                                                                                                                  ('0d823f6e-1063-5281-bf54-b04d352249f2', 'BL010', 'Trà Sen Vàng Kem Cheese', 'Trà', 'Trà Ô long thanh mát kết hợp hạt sen bùi, củ năng giòn và lớp kem phô mai mặn béo', NULL, 'traSenVang', 0, TRUE),
                                                                                                                  ('60a3c525-a72d-5dea-bb8e-436d7ed1f7f0', 'BL011', 'Trà Đào Cam Sả', 'Trà', 'Hồng trà ủ lạnh thơm hương sả tươi, cam vàng mọng nước và đào miếng giòn ngọt', NULL, 'traDaoCamSa', 0, TRUE),
                                                                                                                  ('25204519-c2ee-5fb9-a3b0-cd1e4f20a4c8', 'BL012', 'Trà Vải Hoa Hồng', 'Trà', 'Trà lài thanh tao quyện vị ngọt thanh của trái vải ngâm và hương hoa hồng dịu nhẹ', NULL, 'traVaiHoaHong', 0, TRUE),
                                                                                                                  ('f6404914-0dbb-5b96-92f7-02e89db7cea7', 'BL013', 'Trà Mãng Cầu Tươi', 'Trà', 'Mãng cầu xiêm tươi dầm chua ngọt sảng khoái trên nền trà xanh lài đậm vị', NULL, 'traMangCau', 0, TRUE),
                                                                                                                  ('fc7d19ab-08ee-532c-a719-e7d34417bb98', 'BL014', 'Trà Ô Long Nhãn Nhục Hạt Chia', 'Trà', 'Vị ngọt thanh cổ truyền từ nhãn nhục sấy khô, hạt chia bổ dưỡng cùng trà Ô long', NULL, 'traOLongNhanNhuc', 0, TRUE);

WITH base_price(product_code, price) AS (
    VALUES
        ('BL001', 35000.00),
        ('BL002', 40000.00),
        ('BL003', 45000.00),
        ('BL004', 39000.00),
        ('BL005', 39000.00),
        ('BL006', 45000.00),
        ('BL007', 35000.00),
        ('BL008', 45000.00),
        ('BL009', 39000.00),
        ('BL010', 49000.00),
        ('BL011', 45000.00),
        ('BL012', 45000.00),
        ('BL013', 49000.00),
        ('BL014', 45000.00)
)
INSERT INTO public.product_size_prices (product_id, size, price)
SELECT p.id, s.size,
       CASE s.size WHEN 'S' THEN bp.price - 5000
                   WHEN 'M' THEN bp.price
                   WHEN 'L' THEN bp.price + 5000 END
FROM base_price bp
         JOIN public.products p ON p.code = bp.product_code
         CROSS JOIN (VALUES ('S'::public.product_size), ('M'::public.product_size), ('L'::public.product_size)) AS s(size);

CREATE TEMP TABLE seed_initial_ingredients (
    code varchar(30) PRIMARY KEY,
    name varchar(255) NOT NULL,
    unit varchar(10) NOT NULL,
    opening_qty numeric(14,3) NOT NULL,
    min_stock_quantity numeric(14,3) NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_initial_ingredients(code,name,unit,opening_qty,min_stock_quantity) VALUES
                                                                                        ('CF_BOT', 'Cà phê bột', 'g', 16000.000, 2000.000),
                                                                                        ('SUA_DAC', 'Sữa đặc', 'ml', 65000.000, 5000.000),
                                                                                        ('SUA_TUOI', 'Sữa tươi', 'ml', 110000.000, 10000.000),
                                                                                        ('DUONG', 'Đường', 'g', 60000.000, 5000.000),
                                                                                        ('DA_VIEN', 'Đá viên', 'g', 300000.000, 30000.000),
                                                                                        ('NUOC_LOC', 'Nước lọc', 'ml', 600000.000, 50000.000),
                                                                                        ('KEM_MUOI', 'Kem muối', 'ml', 16000.000, 2000.000),
                                                                                        ('NUOC_COT_DUA', 'Nước cốt dừa', 'ml', 24000.000, 3000.000),
                                                                                        ('LONG_DO_TRUNG', 'Lòng đỏ trứng', 'g', 10000.000, 1000.000),
                                                                                        ('TRA_LA', 'Trà khô', 'g', 16000.000, 1500.000),
                                                                                        ('SIRO_DAO', 'Siro đào', 'ml', 20000.000, 2000.000),
                                                                                        ('NUOC_CAM', 'Nước cam', 'ml', 25000.000, 3000.000),
                                                                                        ('SA_CAY', 'Sả', 'g', 10000.000, 1000.000),
                                                                                        ('TRAN_CHAU_DEN', 'Trân châu đen', 'g', 22000.000, 2500.000),
                                                                                        ('TRAN_CHAU_TRANG', 'Trân châu trắng', 'g', 15000.000, 1500.000),
                                                                                        ('THACH_CAFE', 'Thạch cà phê', 'g', 18000.000, 2000.000),
                                                                                        ('KEM_CHEESE', 'Kem cheese', 'ml', 16000.000, 1800.000),
                                                                                        ('KEM_TUOI', 'Kem tươi', 'ml', 19000.000, 2200.000),
                                                                                        ('TRAN_CHAU_HOANG_KIM', 'Trân châu hoàng kim', 'g', 15000.000, 1500.000),
                                                                                        ('THACH_DAO', 'Thạch đào', 'g', 15000.000, 1500.000),
                                                                                        ('THACH_VAI', 'Thạch vải', 'g', 15000.000, 1500.000),
                                                                                        ('PUDDING_TRUNG', 'Pudding trứng', 'g', 14000.000, 1500.000),
                                                                                        ('DAO_MIEN', 'Đào miếng', 'g', 18000.000, 2000.000),
                                                                                        ('THACH_SUONG_SAO', 'Thạch sương sáo', 'g', 18000.000, 2000.000),
                                                                                        ('TRA_O_LONG', 'Trà Ô long', 'g', 14000.000, 1500.000),
                                                                                        ('HAT_SEN', 'Hạt sen', 'g', 20000.000, 2000.000),
                                                                                        ('CU_NANG', 'Củ năng', 'g', 18000.000, 1800.000),
                                                                                        ('TRA_LAI', 'Trà lài', 'g', 15000.000, 1500.000),
                                                                                        ('VAI_NGAM', 'Vải ngâm', 'g', 18000.000, 1800.000),
                                                                                        ('SIRO_HOA_HONG', 'Siro hoa hồng', 'ml', 12000.000, 1200.000),
                                                                                        ('MANG_CAU', 'Mãng cầu xiêm', 'g', 22000.000, 2500.000),
                                                                                        ('NHAN_NHUC', 'Nhãn nhục sấy', 'g', 15000.000, 1500.000),
                                                                                        ('HAT_CHIA', 'Hạt chia', 'g', 10000.000, 1000.000);

INSERT INTO public.ingredients(code,name,unit,stock_quantity,min_stock_quantity,version)
SELECT code,name,unit,opening_qty,min_stock_quantity,1 FROM seed_initial_ingredients;

INSERT INTO public.ingredient_movements
(ingredient_id, movement_type, expected_version, quantity_change, stock_before, stock_after, note)
SELECT i.id, 'OPENING', 0, s.opening_qty, 0, s.opening_qty, 'Ton dau ky (du lieu mau)'
FROM public.ingredients i JOIN seed_initial_ingredients s ON s.code=i.code
WHERE s.opening_qty>0;

-- Dinh luong tham khao cho size M; S 80%, L 125% (thay doi theo cong thuc nhom).
WITH recipe_base(product_code, ingredient_code, quantity_m) AS (
    VALUES
        ('BL001', 'CF_BOT', 20.000::numeric),
        ('BL001', 'SUA_DAC', 30.000::numeric),
        ('BL001', 'DA_VIEN', 150.000::numeric),
        ('BL002', 'CF_BOT', 18.000::numeric),
        ('BL002', 'NUOC_LOC', 160.000::numeric),
        ('BL003', 'CF_BOT', 18.000::numeric),
        ('BL003', 'SUA_TUOI', 140.000::numeric),
        ('BL004', 'TRA_LA', 10.000::numeric),
        ('BL004', 'SIRO_DAO', 25.000::numeric),
        ('BL004', 'DAO_MIEN', 60.000::numeric),
        ('BL004', 'DUONG', 10.000::numeric),
        ('BL004', 'DA_VIEN', 140.000::numeric),
        ('BL004', 'NUOC_LOC', 140.000::numeric),
        ('BL005', 'CF_BOT', 20.000::numeric),
        ('BL005', 'SUA_DAC', 20.000::numeric),
        ('BL005', 'KEM_MUOI', 40.000::numeric),
        ('BL005', 'DA_VIEN', 130.000::numeric),
        ('BL006', 'CF_BOT', 18.000::numeric),
        ('BL006', 'LONG_DO_TRUNG', 20.000::numeric),
        ('BL006', 'SUA_DAC', 20.000::numeric),
        ('BL006', 'DUONG', 8.000::numeric),
        ('BL007', 'CF_BOT', 10.000::numeric),
        ('BL007', 'SUA_DAC', 35.000::numeric),
        ('BL007', 'SUA_TUOI', 110.000::numeric),
        ('BL007', 'DA_VIEN', 150.000::numeric),
        ('BL008', 'CF_BOT', 18.000::numeric),
        ('BL008', 'NUOC_COT_DUA', 80.000::numeric),
        ('BL008', 'SUA_DAC', 15.000::numeric),
        ('BL008', 'DA_VIEN', 160.000::numeric),
        ('BL009', 'CF_BOT', 15.000::numeric),
        ('BL009', 'SUA_TUOI', 120.000::numeric),
        ('BL009', 'THACH_SUONG_SAO', 50.000::numeric),
        ('BL009', 'DA_VIEN', 130.000::numeric),
        ('BL010', 'TRA_O_LONG', 10.000::numeric),
        ('BL010', 'HAT_SEN', 40.000::numeric),
        ('BL010', 'CU_NANG', 35.000::numeric),
        ('BL010', 'KEM_CHEESE', 40.000::numeric),
        ('BL010', 'NUOC_LOC', 140.000::numeric),
        ('BL010', 'DA_VIEN', 130.000::numeric),
        ('BL011', 'TRA_LA', 10.000::numeric),
        ('BL011', 'SIRO_DAO', 25.000::numeric),
        ('BL011', 'DAO_MIEN', 55.000::numeric),
        ('BL011', 'NUOC_CAM', 50.000::numeric),
        ('BL011', 'SA_CAY', 10.000::numeric),
        ('BL011', 'NUOC_LOC', 140.000::numeric),
        ('BL011', 'DA_VIEN', 130.000::numeric),
        ('BL012', 'TRA_LAI', 10.000::numeric),
        ('BL012', 'VAI_NGAM', 60.000::numeric),
        ('BL012', 'SIRO_HOA_HONG', 15.000::numeric),
        ('BL012', 'NUOC_LOC', 140.000::numeric),
        ('BL012', 'DA_VIEN', 150.000::numeric),
        ('BL013', 'TRA_LAI', 10.000::numeric),
        ('BL013', 'MANG_CAU', 90.000::numeric),
        ('BL013', 'DUONG', 15.000::numeric),
        ('BL013', 'NUOC_LOC', 140.000::numeric),
        ('BL013', 'DA_VIEN', 130.000::numeric),
        ('BL014', 'TRA_O_LONG', 10.000::numeric),
        ('BL014', 'NHAN_NHUC', 40.000::numeric),
        ('BL014', 'HAT_CHIA', 8.000::numeric),
        ('BL014', 'DUONG', 12.000::numeric),
        ('BL014', 'NUOC_LOC', 150.000::numeric),
        ('BL014', 'DA_VIEN', 130.000::numeric)
), size_ratio(size, ratio) AS (
    VALUES ('S'::public.product_size, 0.80::numeric),
           ('M'::public.product_size, 1.00::numeric),
           ('L'::public.product_size, 1.25::numeric)
)
INSERT INTO public.product_ingredients (product_id, size, ingredient_id, quantity)
SELECT p.id, sr.size, i.id, round(rb.quantity_m * sr.ratio, 3)
FROM recipe_base rb
         JOIN public.products p ON p.code = rb.product_code
         JOIN public.ingredients i ON i.code = rb.ingredient_code
         CROSS JOIN size_ratio sr
         JOIN public.product_size_prices psp ON psp.product_id = p.id AND psp.size = sr.size;

-- Topping quantity per ONE serving (nhan voi order_items.quantity va servings cua topping).
WITH topping_recipe(topping_code, ingredient_code, quantity) AS (
    VALUES
        ('TP001', 'TRAN_CHAU_DEN', 35.000::numeric),
        ('TP002', 'TRAN_CHAU_TRANG', 35.000::numeric),
        ('TP003', 'THACH_CAFE', 40.000::numeric),
        ('TP004', 'KEM_CHEESE', 40.000::numeric),
        ('TP005', 'KEM_TUOI', 35.000::numeric),
        ('TP006', 'TRAN_CHAU_HOANG_KIM', 35.000::numeric),
        ('TP007', 'THACH_DAO', 40.000::numeric),
        ('TP008', 'THACH_VAI', 40.000::numeric),
        ('TP009', 'CF_BOT', 18.000::numeric),
        ('TP009', 'NUOC_LOC', 35.000::numeric),
        ('TP010', 'PUDDING_TRUNG', 40.000::numeric)
)
INSERT INTO public.topping_ingredients (topping_id, ingredient_id, quantity)
SELECT t.id, i.id, r.quantity
FROM topping_recipe r
         JOIN public.toppings t ON t.code = r.topping_code
         JOIN public.ingredients i ON i.code = r.ingredient_code;

COMMIT;
