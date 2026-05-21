# Các tích hợp của MedCare

Hệ thống MedCare tích hợp nhiều dịch vụ bên thứ ba để tối ưu hóa quy trình thanh toán, vận chuyển, lưu trữ hình ảnh và xử lý trí tuệ nhân tạo.

---

## 1. Cổng thanh toán VNPay (`payment-service`)

Dịch vụ `payment-service` chịu trách nhiệm tạo và xử lý giao dịch thanh toán trực tuyến qua cổng VNPay của Việt Nam.

### Luồng xử lý thanh toán:
1.  **Tạo liên kết thanh toán:** Khi khách hàng chọn phương thức thanh toán VNPay tại trang `/thanh-toan`, `order-service` sẽ gửi yêu cầu tạo thanh toán đến `payment-service` với mã đơn hàng và số tiền cần thanh toán.
2.  **Sinh URL:** `payment-service` tính toán chữ ký số bảo mật (Secure Hash) dựa trên thuật toán SHA256 kết hợp với Hash Secret do VNPay cấp, ghép các tham số cần thiết và trả về đường dẫn URL thanh toán.
3.  **Thanh toán tại VNPay:** Khách hàng được chuyển hướng sang cổng thanh toán của VNPay để thực hiện giao dịch (quét mã QR hoặc nhập thẻ ngân hàng).
4.  **Xử lý phản hồi (Callback):**
    *   **Client Callback:** Sau khi giao dịch kết thúc, VNPay chuyển hướng người dùng về trang `/payment` của Next.js kèm các tham số kết quả. Frontend gọi API Gateway gửi kết quả này về `payment-service` để kiểm tra chữ ký số và hiển thị thông báo thành công/thất bại.
    *   **IPN (Instant Payment Notification):** VNPay gọi trực tiếp đến API Webhook `/api/v1/payments/ipn` của backend để cập nhật trạng thái đơn hàng trong cơ sở dữ liệu kể cả khi người dùng tắt trình duyệt đột ngột.

---

## 2. Dịch vụ vận chuyển Giao Hàng Nhanh - GHN (`shipping-service`)

Dịch vụ `shipping-service` kết nối trực tiếp với API của GHN để tự động hóa khâu tính phí ship và tạo đơn vận chuyển.

### Các API tích hợp:
*   **Đồng bộ danh mục khu vực:** Hệ thống đồng bộ danh sách Tỉnh/Thành, Quận/Huyện, Phường/Xã từ GHN về cơ sở dữ liệu để người dùng chọn địa chỉ chính xác khi đặt hàng.
*   **Tính phí vận chuyển:** Khi người dùng thay đổi địa chỉ giao hàng hoặc thêm sản phẩm, frontend gọi `shipping-service`. Dịch vụ này gửi thông tin mã phường/xã của kho hàng gửi đi và phường/xã người nhận cùng trọng lượng ước tính của giỏ hàng tới GHN API để nhận lại cước phí chính xác theo thời gian thực.
*   **Tạo vận đơn:** Khi đơn hàng chuyển sang trạng thái `CONFIRMED`, hệ thống gửi yêu cầu tạo vận đơn đến hệ thống GHN, nhận lại mã vận đơn (`tracking_code`) để cập nhật vào cơ sở dữ liệu giúp khách hàng theo dõi hành trình đơn hàng.

---

## 3. Lưu trữ đám mây Cloudinary (`user-service` & `product-service`)

Cloudinary được sử dụng làm kho lưu trữ hình ảnh đám mây ổn định cho toàn hệ thống.

*   **Hình ảnh sản phẩm:** Admin tải ảnh thuốc lên thông qua trang quản trị, frontend gửi ảnh trực tiếp đến dịch vụ Cloudinary để tối ưu hóa kích thước và nhận lại link ảnh HTTPS cùng `public_id` để lưu vào bảng `medicine_images` trong `medcare_product_db`.
*   **Ảnh đơn thuốc người dùng:** Khi người dùng đăng tải ảnh đơn thuốc tại trang `/toa-thuoc` hoặc khung tư vấn chat AI, ảnh được tải lên thư mục bảo mật của Cloudinary giúp dược sĩ có thể dễ dàng truy cập và kiểm duyệt trên trang quản trị.

---

## 4. Google Gemini AI & LangChain (`ai-service`)

Dịch vụ AI chạy trên nền tảng Python FastAPI sử dụng thư viện LangChain để giao tiếp với các mô hình ngôn ngữ lớn (LLMs).

*   **Model sử dụng:** Google Gemini 1.5 Flash (tốc độ cao phục vụ chat thời gian thực) và Gemini 1.5 Pro (độ chính xác cao phục vụ phân tích đơn thuốc phức tạp).
*   **Nhận diện đơn thuốc (AI-OCR):** AI nhận dữ liệu text trích xuất từ ảnh đơn thuốc và sử dụng cấu trúc Prompt định dạng sẵn để phân loại tên thuốc, liều lượng, hoạt chất, chẩn đoán của bác sĩ, sau đó trả về dữ liệu dạng JSON khớp với danh mục sản phẩm trong cơ sở dữ liệu của MedCare.
*   **Server-Sent Events (SSE):** Hỗ trợ phản hồi dạng dòng (Streaming Response) trong chatbot tư vấn sức khỏe giúp tăng tốc độ phản hồi trải nghiệm người dùng, tạo cảm giác AI đang viết tin nhắn trực tiếp.

---

## 5. Nhận diện chữ Tesseract.js (Client-side OCR)

Để giảm thiểu chi phí xử lý và nâng cao hiệu suất máy chủ AI, MedCare sử dụng thư viện **Tesseract.js** chạy trực tiếp trên trình duyệt của người dùng:

1.  Khi người dùng chọn ảnh đơn thuốc, Tesseract.js sẽ tiền xử lý ảnh (bình thường hóa độ sáng, tăng độ tương phản) và nhận dạng chữ tiếng Việt/tiếng Anh sơ bộ.
2.  Sau khi nhận dạng xong, phần text thô sẽ được gửi lên `ai-service` kèm theo ảnh gốc. Việc này giúp AI Service giảm bớt thời gian xử lý ảnh gốc dung lượng lớn và tăng tính chính xác do có text định hướng sẵn.
