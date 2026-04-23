-- ==========================================================
-- SCRIPT KHỞI TẠO DATABASE MICRO SERVICES - MEDCARE
-- Cập nhật lần cuối: 2026-04-22 (Đồng bộ với Codebase Milestone 1)
-- ==========================================================

-- ----------------------------------------------------------
-- 1. AUTH SERVICE
-- ----------------------------------------------------------
CREATE DATABASE IF NOT EXISTS medcare_auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medcare_auth_db;

CREATE TABLE auth_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    role ENUM('USER','ADMIN','PHARMACIST') DEFAULT 'USER',
    status ENUM('ACTIVE','PENDING','INACTIVE','BANNED') DEFAULT 'PENDING',
    account_version INT NOT NULL DEFAULT 1 COMMENT 'Tăng mỗi khi admin thay đổi role/status để vô hiệu hóa JWT cũ ngay lập tức',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(512) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP NULL COMMENT 'Thời điểm bị thu hồi để hỗ trợ grace period',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE otp_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    type ENUM('REGISTRATION', 'PASSWORD_RESET') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_otp_email_type (email, type)
);

CREATE INDEX idx_auth_user_id ON refresh_tokens(user_id);

-- ----------------------------------------------------------
-- 2. USER SERVICE
-- ----------------------------------------------------------
CREATE DATABASE IF NOT EXISTS medcare_user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medcare_user_db;

CREATE TABLE user_profiles (
    user_id BIGINT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    role VARCHAR(50) DEFAULT 'USER',
    status VARCHAR(50) DEFAULT 'PENDING',
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS `addresses` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `receiver_name` VARCHAR(100) DEFAULT NULL,
  `receiver_phone` VARCHAR(20) DEFAULT NULL,
  `full_address` TEXT NOT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `district` VARCHAR(100) DEFAULT NULL,
  `city_id` INT DEFAULT NULL,
  `district_id` INT DEFAULT NULL,
  `ward_code` VARCHAR(20) DEFAULT NULL,
  `is_default` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_address_user` FOREIGN KEY (`user_id`) REFERENCES `user_profiles` (`user_id`) ON DELETE CASCADE
);

CREATE INDEX idx_address_user_id ON addresses(user_id);

-- ----------------------------------------------------------
-- 3. PRODUCT SERVICE 
-- ----------------------------------------------------------
CREATE DATABASE IF NOT EXISTS medcare_product_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medcare_product_db;

-- 1. Bảng Danh mục 
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    parent_id BIGINT,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 2. Bảng Thuốc chính (Lưu các thông tin định danh)
CREATE TABLE medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_sku VARCHAR(50) UNIQUE COMMENT 'Mã SKU từ Long Châu',
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    category_id BIGINT,
    registration_number VARCHAR(50) COMMENT 'Số đăng ký Bộ Y tế (registNum)',
    requires_prescription BOOLEAN DEFAULT FALSE COMMENT 'Thuốc cần kê toa (true/false)',
    packing_unit VARCHAR(100) COMMENT 'Quy cách: Hộp 10 viên, Lọ 100ml...',
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 3. Bảng Chi tiết thuốc 
CREATE TABLE medicine_details (
    medicine_id BIGINT PRIMARY KEY,
    brand VARCHAR(100) COMMENT 'Thương hiệu',
    manufacturer VARCHAR(200) COMMENT 'Nhà sản xuất (producer)',
    country_of_origin VARCHAR(100) COMMENT 'Nước sản xuất (manufactor)',
    dosage_form VARCHAR(100) COMMENT 'Dạng bào chế',
    expiry_date VARCHAR(100) COMMENT 'Hạn sử dụng',
    active_ingredients TEXT COMMENT 'Thành phần hoạt chất đầy đủ',
    description TEXT COMMENT 'Mô tả ngắn/Tổng quan',
    indications TEXT COMMENT 'Công dụng/Chỉ định (indications)',
    usage_instruction TEXT COMMENT 'Cách dùng (dosage)',
    contraindications TEXT COMMENT 'Chống chỉ định (contraindication)',
    side_effects TEXT COMMENT 'Tác dụng phụ (adverseEffect)',
    precautions TEXT COMMENT 'Lưu ý/Thận trọng (careful)',
    storage_conditions TEXT COMMENT 'Bảo quản (preservation)',
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);

-- 4. Bảng Giá
CREATE TABLE medicine_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    original_price DECIMAL(12,2) COMMENT 'Giá gốc niêm yết',
    discount_percentage INT DEFAULT 0 COMMENT 'Phần trăm giảm giá',
    price DECIMAL(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);

-- 5. Bảng Hình ảnh 
CREATE TABLE medicine_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    public_id VARCHAR(255) COMMENT 'ID để xóa/sửa ảnh trên Cloudinary',
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);

-- 6. Hệ thống Triệu chứng (Phục vụ AI Chatbot & Mapping)
CREATE TABLE symptoms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicine_symptoms (
    medicine_id BIGINT NOT NULL,
    symptom_id BIGINT NOT NULL,
    relevance_score FLOAT DEFAULT 1.0 COMMENT 'Độ phù hợp của thuốc với triệu chứng',
    PRIMARY KEY (medicine_id, symptom_id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    FOREIGN KEY (symptom_id) REFERENCES symptoms(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------
-- INDEX ĐỂ TỐI ƯU TỐC ĐỘ SEARCH
-- ----------------------------------------------------------
CREATE INDEX idx_source_sku ON medicines(source_sku);
CREATE INDEX idx_medicine_slug ON medicines(slug);
CREATE INDEX idx_medicine_reg_num ON medicines(registration_number);
CREATE INDEX idx_image_medicine ON medicine_images(medicine_id);
CREATE INDEX idx_price_medicine ON medicine_prices(medicine_id);
 
-- ----------------------------------------------------------
-- 4. INVENTORY SERVICE
-- ----------------------------------------------------------
CREATE DATABASE IF NOT EXISTS medcare_inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medcare_inventory_db;

CREATE TABLE warehouses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE inventory_batches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,      -- ID thuốc từ Product Service
    warehouse_id BIGINT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    supplier_id BIGINT,               -- ID nhà cung cấp
    expiry_date DATE NOT NULL,        -- Ngày hết hạn (Phục vụ FEFO)
    
    -- Quản lý số lượng
    quantity_available INT DEFAULT 0, -- Tổng lượng thực tế trong kho
    quantity_reserved INT DEFAULT 0,  -- Lượng đã bị "giữ chỗ" cho đơn hàng chưa thanh toán
    
    -- Trạng thái lô hàng
    status ENUM('ACTIVE', 'QUARANTINE', 'EXPIRED', 'RECALLED') DEFAULT 'ACTIVE',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Ràng buộc: Lượng giữ chỗ không được vượt quá lượng thực có
    CONSTRAINT chk_quantity_reserved CHECK (quantity_reserved <= quantity_available),
    CONSTRAINT fk_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- Index phục vụ truy vấn và thuật toán FEFO (First Expired, First Out)
CREATE INDEX idx_inventory_medicine ON inventory_batches(medicine_id);
CREATE INDEX idx_inventory_batch ON inventory_batches(batch_number);
CREATE INDEX idx_inventory_expiry ON inventory_batches(expiry_date); -- Cực kỳ quan trọng để sắp xếp hàng sắp hết hạn
CREATE INDEX idx_inventory_status ON inventory_batches(status);

CREATE TABLE inventory_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    batch_id BIGINT,
    actor_id BIGINT COMMENT 'user_id hoặc pharmacist_id thực hiện',
    
    -- Loại thay đổi
    change_type ENUM('IN', 'OUT', 'RESERVE', 'RELEASE', 'ADJUST') NOT NULL,
    reason_code VARCHAR(50) COMMENT 'Lý do: SALE, DAMAGED, RETURNED, IMPORT',
    
    quantity INT NOT NULL,
    reference_id VARCHAR(100) COMMENT 'Mã đơn hàng hoặc mã phiếu nhập/xuất liên quan',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_inventory_batch_log FOREIGN KEY (batch_id) REFERENCES inventory_batches(id) ON DELETE SET NULL
);



-- ----------------------------------------------------------
-- 6. ORDER SERVICE (ĐÃ SỬA order_id)
-- ----------------------------------------------------------
CREATE DATABASE IF NOT EXISTS medcare_order_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medcare_order_db;

CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'MC-20260326-001234',
    user_id BIGINT NOT NULL,
    recipient_name VARCHAR(150),
    recipient_phone VARCHAR(20),
    recipient_address TEXT,
    city_id INT,
    district_id INT,
    ward_code VARCHAR(20),
    total_price DECIMAL(12,2) NOT NULL,
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(12,2) NOT NULL,
    status ENUM('PENDING','CONFIRMED','SHIPPING','DELIVERED','CANCELLED','PENDING_PRESCRIPTION') DEFAULT 'PENDING',
    order_type ENUM('OTC','PRESCRIPTION') DEFAULT 'OTC',
    payment_method ENUM('COD','VNPAY') DEFAULT 'COD',
    voucher_code VARCHAR(50),
    discount_amount DECIMAL(12,2) DEFAULT 0,
    note TEXT,
    prescription_image_url VARCHAR(500),
    extracted_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    medicine_name VARCHAR(255),
    unit_price DECIMAL(12,2),
    quantity INT,
    sub_total DECIMAL(12,2),
    batch_number VARCHAR(50) COMMENT 'batch dùng để traceability',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_order_user ON orders(user_id);
CREATE INDEX idx_order_code ON orders(order_code);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Bảng kết thúc dịch vụ Order

-- ----------------------------------------------------------
-- 7. PAYMENT SERVICE
-- ----------------------------------------------------------
CREATE DATABASE IF NOT EXISTS medcare_payment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medcare_payment_db;

CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) NOT NULL,
    provider ENUM('VNPAY','COD') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status ENUM('PENDING','SUCCESS','FAILED','REFUNDED') DEFAULT 'PENDING',
    transaction_id VARCHAR(100),
    payment_method_details JSON,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    raw_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE INDEX idx_payment_order ON payments(order_code);

-- Bảng kết thúc dịch vụ Payment

-- ----------------------------------------------------------
-- 8. SHIPPING SERVICE
-- ----------------------------------------------------------
CREATE DATABASE IF NOT EXISTS medcare_shipping_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medcare_shipping_db;

CREATE TABLE shipments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) NOT NULL,
    tracking_code VARCHAR(100) UNIQUE,
    carrier ENUM('GHTK','GHN','JNT','VIETTELPOST','GRABEXPRESS') NOT NULL,
    status ENUM('PENDING','PICKED_UP','IN_TRANSIT','DELIVERED','RETURNED') DEFAULT 'PENDING',
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    estimated_delivery_date DATE
);

-- ----------------------------------------------------------
-- 9. PROMOTION SERVICE
-- ----------------------------------------------------------
CREATE DATABASE IF NOT EXISTS medcare_promotion_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medcare_promotion_db;

CREATE TABLE vouchers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- Mã code (VD: MEDCARE2026)
    title VARCHAR(255) NOT NULL,      -- Tiêu đề hiển thị (VD: Giảm 50k cho đơn đầu)
    description TEXT,                  -- Mô tả chi tiết điều kiện áp dụng
    -- Loại và giá trị giảm giá
    discount_type ENUM('PERCENT', 'FIXED', 'FREESHIP') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL, -- Giá trị giảm (Ví dụ: 10.00 hoặc 50000.00)
    max_discount DECIMAL(10, 2),            -- Mức giảm tối đa (Áp dụng cho PERCENT)
    min_order_value DECIMAL(10, 2) DEFAULT 0, -- Giá trị đơn hàng tối thiểu
    
    -- Giới hạn số lượng
    usage_limit INT DEFAULT 999999,   -- Tổng số lượng mã phát hành
    limit_per_user INT DEFAULT 1,     -- Mỗi user được dùng tối đa bao nhiêu lần
    used_count INT DEFAULT 0,         -- Số lượng đã thực tế sử dụng
    
    -- Ràng buộc y tế & chuyên biệt
    exclude_prescription_drugs BOOLEAN DEFAULT TRUE, -- TRUE: Không áp dụng cho thuốc kê đơn
    
    -- Thời gian và trạng thái
    start_at TIMESTAMP NULL,
    end_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Index để tìm kiếm mã nhanh hơn
    INDEX idx_voucher_code (code),
    INDEX idx_active_status (is_active, start_at, end_at)
);

CREATE TABLE voucher_usages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    voucher_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,          -- ID User từ User Service
    order_id BIGINT NOT NULL,         -- ID Đơn hàng từ Order Service
    amount_saved DECIMAL(10, 2),      -- Số tiền thực tế đã được giảm cho đơn này
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Khóa ngoại và Index
    CONSTRAINT fk_voucher_usage FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
    INDEX idx_user_usage (user_id),
    INDEX idx_voucher_user (voucher_id, user_id) -- Dùng để check nhanh giới hạn dùng của 1 user
);

-- 3. Bảng Voucher người dùng đã lưu
CREATE TABLE user_vouchers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    voucher_id BIGINT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_used BOOLEAN DEFAULT FALSE,
    UNIQUE KEY unique_user_voucher (user_id, voucher_id),
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE
);


-- ----------------------------------------------------------
-- 10. REVIEW SERVICE
-- ----------------------------------------------------------
-- ----------------------------------------------------------
-- 10. REVIEW SERVICE (OPTIMIZED FOR GUEST & MEMBER)
-- ----------------------------------------------------------
CREATE DATABASE IF NOT EXISTS medcare_review_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medcare_review_db;

CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL COMMENT 'ID sản phẩm từ Product Service',
    product_slug VARCHAR(255) NULL COMMENT 'Slug sản phẩm để tạo link nhanh',
    user_id BIGINT NULL COMMENT 'ID người dùng nếu đã đăng nhập',
    guest_name VARCHAR(100) NULL COMMENT 'Họ tên khách nhập',
    guest_phone VARCHAR(20) NULL COMMENT 'Số điện thoại khách nhập',
    guest_email VARCHAR(100) NULL COMMENT 'Email khách (không bắt buộc)',
    order_item_id BIGINT NULL COMMENT 'ID chi tiết đơn hàng để xác thực đã mua',
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    product_name VARCHAR(255) NULL COMMENT 'Tên sản phẩm tại thời điểm đánh giá',
    product_image VARCHAR(500) NULL COMMENT 'Ảnh sản phẩm tại thời điểm đánh giá',
    edit_count INT DEFAULT 0 COMMENT 'Số lần đã chỉnh sửa đánh giá',
    is_approved BOOLEAN DEFAULT TRUE COMMENT 'Tự động duyệt, admin có thể ẩn',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE review_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

-- Bảng Phản hồi - CHỈ DÀNH CHO ADMIN VÀ DƯỢC SĨ
CREATE TABLE review_replies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL COMMENT 'ID nhân viên / admin trả lời',
    staff_name VARCHAR(100) NOT NULL COMMENT 'Tên hiển thị',
    staff_role ENUM('ADMIN','PHARMACIST') NOT NULL COMMENT 'Vai trò',
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

CREATE INDEX idx_review_product ON reviews(product_id);
CREATE INDEX idx_review_user ON reviews(user_id);
CREATE INDEX idx_review_status ON reviews(is_approved, created_at);
CREATE INDEX idx_review_guest_phone ON reviews(guest_phone);
CREATE INDEX idx_review_guest_email ON reviews(guest_email);

-- ----------------------------------------------------------
-- 11. AI / CHATBOT SERVICE
-- ----------------------------------------------------------
CREATE DATABASE IF NOT EXISTS medcare_chatbot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medcare_chatbot_db;

CREATE TABLE chatbot_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT COMMENT 'ID người dùng, NULL nếu là khách',
    session_id VARCHAR(100) NOT NULL COMMENT 'ID phiên chat để gom nhóm',
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    detected_symptoms JSON COMMENT 'Các triệu chứng AI bắt được',
    suggested_medicines JSON COMMENT 'Danh sách thuốc đã gợi ý',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chatbot_user ON chatbot_logs(user_id);
CREATE INDEX idx_chatbot_session ON chatbot_logs(session_id)