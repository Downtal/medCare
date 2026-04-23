# Kiến trúc hệ thống MedCare

## Kiến trúc Microservices
Dự án được xây dựng theo mô hình Microservices với các trách nhiệm được phân tán:

### Các dịch vụ cốt lõi (Core Services)
- **Discovery Server:** Bộ đăng ký dịch vụ dựa trên Eureka.
- **API Gateway:** Điểm truy cập tập trung cho tất cả các yêu cầu từ Frontend.
- **Auth Service:** Xử lý xác thực và cấp phát mã thông báo (token).
- **User Service:** Quản lý thông tin hồ sơ và địa chỉ người dùng.

### Các dịch vụ nghiệp vụ (Business Services)
- **Product Service:** Quản lý danh mục sản phẩm.
- **Inventory Service:** Theo dõi tồn kho.
- **Order Service:** Luồng giao dịch và lưu trữ đơn hàng.
- **Shipping Service:** Logistics vận chuyển và tính phí vận chuyển.
- **Promotion Service:** Quản lý Voucher và khuyến mãi.
- **Review Service:** Phản hồi và đánh giá từ khách hàng.
- **Notification Service:** Thông báo bất đồng bộ (dự kiến).

### Frontend
- **Next.js App Router:** Kết xuất phía máy chủ (SSR) hiện đại và tương tác phía máy khách.
- **Modular Services:** Các dịch vụ frontend (trong `FE/services/`) được ánh xạ chặt chẽ với các microservices backend.

## Luồng dữ liệu (Data Flow)
1. Client (FE) yêu cầu API thông qua `api-gateway`.
2. `api-gateway` xác thực JWT nếu cần thiết và định tuyến đến dịch vụ đích.
3. Các dịch vụ giao tiếp với nhau thông qua `OpenFeign` bằng tên được giải quyết bởi `Eureka`.
4. Trạng thái được lưu trữ trong `MySQL` hoặc lưu vào bộ nhớ đệm `Redis`.

## Các mẫu thiết kế (Design Patterns)
- **API Gateway Pattern:** Điểm truy cập thống nhất.
- **Service Discovery Pattern:** Giải quyết endpoint động.
- **Sidecar/Proxy Pattern:** Các Eureka clients.
- **DTO (Data Transfer Object):** Tách biệt các thực thể nội bộ khỏi các hợp đồng API bên ngoài.
