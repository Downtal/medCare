# Cấu trúc thư mục của MedCare

Dự án MedCare được phân chia thành 3 phần rõ rệt: Backend (`BE/`), Frontend (`FE/`), và Database scripts (`DB/`). Dưới đây là cấu trúc chi tiết của các thành phần chính.

---

## 1. Backend Codebase Structure (BE/)

Thư mục `BE/` là một Gradle Multi-project, chứa các module con đại diện cho từng microservice:

```text
BE/
├── build.gradle                   # Cấu hình Gradle chung cho tất cả các sub-projects
├── settings.gradle                # Liệt kê danh sách các microservices Java
├── gradlew & gradlew.bat          # Gradle wrappers phục vụ build dự án không cần cài Gradle
├── .env                           # File chứa cấu hình môi trường toàn cục (DB, JWT secret, Cloudinary key...)
│
├── common-lib/                    # Thư viện dùng chung (DTO, Exceptions, Security Config) cho Java services
│   ├── src/main/java/com/medcare/common/
│   │   ├── dto/                   # Các DTO dùng chung (UserDTO, OrderDTO, ProductDTO...)
│   │   ├── exception/             # Xử lý ngoại lệ tập trung (GlobalExceptionHandler)
│   │   └── security/              # Cấu hình giải mã và xác thực token JWT
│
├── api-gateway/                   # Spring Cloud Gateway (Port 8080)
│   └── src/main/resources/application.yml  # Định tuyến và phân quyền chi tiết cho API
│
├── auth-service/                  # Xác thực người dùng (Port 8081)
│   └── src/main/java/com/medcare/authservice/
│       ├── controller/            # API Endpoints đăng ký, login, OTP
│       ├── service/               # Logic tạo JWT, mã hóa password, gửi email OTP
│       └── repository/            # Truy vấn bảng auth_users, refresh_tokens
│
├── user-service/                  # Thông tin người dùng & đơn thuốc (Port 8082)
│   └── src/main/java/com/medcare/userservice/
│       ├── controller/            # API hồ sơ cá nhân, địa chỉ, đơn thuốc tải lên
│       ├── service/               # Xử lý đơn thuốc, cập nhật thông tin sức khỏe
│       └── repository/            # Truy vấn bảng user_profiles, prescriptions
│
├── product-service/               # Danh mục & chi tiết thuốc (Port 8083)
│   └── src/main/java/com/medcare/productservice/
│       ├── controller/            # API lấy danh sách thuốc, chi tiết, triệu chứng
│       ├── service/               # Quản lý thuốc, lọc theo danh mục, ánh xạ triệu chứng
│       └── repository/            # Truy vấn bảng medicines, categories, symptoms
│
├── order-service/                 # Giỏ hàng & quản lý đặt hàng (Port 8084)
├── inventory-service/             # Quản lý kho hàng & lô hàng FEFO (Port 8085)
├── payment-service/               # Cổng thanh toán VNPay & COD (Port 8086)
├── shipping-service/              # Tính toán phí và trạng thái từ GHN (Port 8087)
├── promotion-service/             # Quản lý mã giảm giá, voucher (Port 8088)
├── review-service/                # Đánh giá sản phẩm thành viên/khách (Port 8089)
│
└── ai-service/                    # Dịch vụ Python FastAPI (Port 8000)
    ├── app/
    │   ├── api/                   # Router xử lý chat, recommendations, prescriptions OCR
    │   ├── config/                # Quản lý cấu hình settings từ file .env
    │   ├── core/                  # Cấu hình rate limiter, kết nối Eureka
    │   ├── models/                # Định nghĩa SQLAlchemy models cho chatbot_logs
    │   └── services/              # Xử lý nghiệp vụ tương tác Gemini AI, xử lý logic OCR
    └── requirements.txt           # Danh sách các thư viện Python cần cài đặt
```

---

## 2. Frontend Codebase Structure (FE/)

Frontend sử dụng Next.js 15 với mô hình cấu trúc App Router định hướng theo file:

```text
FE/
├── app/                           # Thư mục chứa Router và Trang chính
│   ├── layout.tsx                 # Root layout chứa Providers & Header/Footer toàn trang
│   ├── page.tsx                   # Trang chủ MedCare (banners, danh mục nổi bật, sản phẩm bán chạy)
│   ├── admin/                     # Trang quản trị dành cho ADMIN / PHARMACIST
│   │   ├── layout.tsx             # Layout quản trị (có sidebar điều hướng)
│   │   ├── page.tsx               # Dashboard hiển thị báo cáo biểu đồ doanh thu
│   │   ├── don-hang/              # Quản lý danh sách đơn hàng
│   │   ├── don-thuoc/             # Dược sĩ duyệt ảnh đơn thuốc y tế tải lên
│   │   └── kho-hang/              # Quản lý kho, nhập lô hàng mới
│   ├── tu-van/                    # Trang chat tư vấn AI chuyên sâu (Split-pane)
│   ├── cua-hang/                  # Danh mục sản phẩm thuốc và bộ lọc tìm kiếm
│   ├── san-pham/[slug]/           # Trang thông tin chi tiết một sản phẩm thuốc
│   ├── gio-hang/                  # Trang giỏ hàng của người dùng
│   ├── thanh-toan/                # Trang điền thông tin giao hàng, thanh toán và áp voucher
│   ├── payment/                   # Trang xử lý kết quả callback chuyển hướng từ VNPay
│   └── tai-khoan/                 # Trang thông tin cá nhân và quản lý đơn hàng đã mua
│
├── components/                    # Các components giao diện dùng chung
│   ├── chat/                      # Component liên quan chatbot: ai-chatbot.tsx, product-carousel.tsx
│   ├── ui/                        # Các nguyên tố giao diện cơ bản từ Shadcn UI (button, input, dialogue...)
│   ├── header.tsx & footer.tsx    # Header, Footer của hệ thống
│   └── cart-drawer.tsx            # Drawer giỏ hàng trượt nhanh từ cạnh phải màn hình
│
├── services/                      # API Client kết nối với Microservices thông qua Gateway
│   ├── productService.ts          # API liên quan sản phẩm, tìm kiếm, danh mục
│   ├── orderService.ts            # API liên quan tạo đơn, giỏ hàng database
│   ├── voucherService.ts          # API lưu, kiểm tra mã giảm giá
│   ├── prescriptionService.ts     # API tải đơn thuốc và xem lịch sử đơn thuốc
│   └── aiService.ts               # API gọi chat với AI và OCR đơn thuốc
│
├── hooks/                         # Các Custom Hooks xử lý trạng thái
│   ├── use-chat.ts                # Quản lý tin nhắn chat, gửi tin nhắn, lưu trữ sessionStorage
│   └── use-cart.ts                # Logic tương tác giỏ hàng
│
├── lib/                           # Hàm tiện ích chung (Config, định dạng tiền tệ VND, utils)
│   ├── config.ts                  # Lấy URL của API Gateway
│   ├── currency.ts                # Định dạng tiền tệ: CurrencyUtils.formatVND(price)
│   └── utils.ts                   # Các hàm css merge (cn)
│
├── types/                         # Chứa các interface TypeScript
├── e2e/                           # Chứa các kịch bản kiểm thử tự động của Playwright
├── package.json                   # Cấu hình npm packages và scripts chạy dự án
└── next.config.mjs                # Cấu hình Next.js (chấp nhận ảnh từ Cloudinary)
```
