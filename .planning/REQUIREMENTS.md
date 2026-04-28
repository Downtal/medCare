# Milestone 5 Requirements: Prescription Management & AI OCR

## 1. Mục tiêu (Objectives)
Thiết lập quy trình chuyên nghiệp cho việc mua thuốc kê đơn (RX), kết hợp sức mạnh của AI OCR để tự động hóa việc đọc đơn thuốc và hệ thống phê duyệt đơn thuốc từ Dược sĩ.

## 2. Các yêu cầu chức năng (Functional Requirements)

### PRE-01: Hệ thống lưu trữ đơn thuốc (Prescription Storage)
- **Mô tả:** Cho phép người dùng upload ảnh đơn thuốc (JPG, PNG).
- **Kỹ thuật:** Tích hợp Cloudinary API để lưu trữ ảnh và trả về URL. Lưu URL và metadata đơn thuốc vào Database.
- **Dữ liệu:** `user_id`, `image_url`, `status` (PENDING, APPROVED, REJECTED), `note`, `pharmacist_id`.

### PRE-02: Quy trình Phê duyệt (Workflow)
- **Trạng thái PENDING:** Khi người dùng upload đơn thuốc.
- **Trạng thái APPROVED:** Dược sĩ xác nhận đơn thuốc hợp lệ.
- **Trạng thái REJECTED:** Dược sĩ từ chối (kèm lý do).
- **Ràng buộc:** Các sản phẩm thuốc có thuộc tính `requiresPrescription = true` chỉ có thể được nhấn "Đặt hàng" nếu người dùng có đơn thuốc tương ứng được APPROVED.

### PRE-03: AI OCR & Analysis (Gemini Multimodal)
- **OCR:** Sử dụng Gemini 1.5 Flash để đọc văn bản từ hình ảnh đơn thuốc.
- **Trích xuất thông tin:** Tên thuốc, liều lượng, cách dùng, bác sĩ kê đơn, ngày kê đơn.
- **Mapping:** Đối soát Text thuốc từ OCR với danh mục `medicine` trong Database để gợi ý sản phẩm cho người dùng.

### PRE-04: Giao diện Dược sĩ (Pharmacist UI)
- **Dashboard Duyệt đơn:** Danh sách các đơn thuốc PENDING.
- **Xem chi tiết:** Hiển thị ảnh đơn thuốc và thông tin AI trích xuất được để Dược sĩ đối chiếu và nhấn nút Duyệt/Từ chối.

### PRE-05: Thông báo Real-time
- **WebSocket/FCM:** Gửi thông báo ngay lập tức cho người dùng khi đơn thuốc được cập nhật trạng thái.

## 3. Các yêu cầu phi chức năng (Non-functional Requirements)
- **Bảo mật:** Ảnh đơn thuốc chỉ được truy cập bởi người dùng sở hữu và Dược sĩ hệ thống.
- **Độ trễ AI:** Quá trình OCR không nên quá 10 giây.
- **UX:** Luồng upload ảnh và nhận kết quả từ AI phải có loading states rõ ràng và chuyên nghiệp.

## 4. Tiêu chí nghiệm thu (UAT)
- [ ] Người dùng upload được ảnh đơn thuốc lên Cloudinary.
- [ ] AI Gemini trả về đúng JSON thông tin thuốc từ ảnh.
- [ ] Dược sĩ có thể duyệt đơn thuốc và trạng thái cập nhật đúng trong DB.
- [ ] Người dùng nhận được thông báo khi đơn được duyệt.
- [ ] Nút "Đặt hàng" của thuốc RX hoạt động đúng theo trạng thái đơn thuốc.
