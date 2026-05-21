# BÁO CÁO TIẾN ĐỘ THỰC HIỆN TIỂU LUẬN/ĐỒ ÁN TỐT NGHIỆP: DỰ ÁN MEDCARE

**Ngày cập nhật:** 15/05/2026
**Tên dự án:** MedCare - Nền tảng Y tế và Chăm sóc Sức khỏe Toàn diện

---

## 1. TỔNG QUAN HỆ THỐNG
Dự án MedCare được định hướng là một nền tảng chăm sóc sức khỏe hiện đại, thiết kế theo kiến trúc **Microservices (Polyglot)** nhằm đáp ứng tải cao và dễ dàng mở rộng chức năng trong tương lai.

### 1.1. Kiến trúc Hạ tầng & Backend (Java & Python)
- **Core Framework:** Sử dụng Spring Boot 3.4.x (Java 21+) làm bộ khung chính.
- **Microservices Orchestration:** Spring Cloud Netflix Eureka đảm nhận vai trò Discovery Server, giúp các dịch vụ tự động nhận diện lẫn nhau. Spring Cloud Gateway đứng vai trò cổng kiểm soát (API Gateway), định tuyến toàn bộ yêu cầu từ Frontend.
- **AI Service:** Tách biệt thành một hệ thống riêng sử dụng **Python 3.12+ (FastAPI)**, tích hợp **LangChain** và **Google Gemini AI 1.5** nhằm xử lý tối ưu các bài toán đòi hỏi suy luận như tư vấn y tế (Chatbot) và trích xuất dữ liệu từ đơn thuốc (OCR).
- **Giao tiếp Dịch vụ:** Tích hợp OpenFeign (Java) và HTTPX (Python) cho việc trao đổi dữ liệu nội bộ qua chuẩn REST.
- **Dữ liệu & Bộ nhớ đệm:** 
  - Lưu trữ dữ liệu cấu trúc bằng MySQL thông qua Spring Data JPA.
  - Sử dụng Redis Cloud để quản lý giỏ hàng, phiên đăng nhập (JWT blacklist) nhằm tối ưu tốc độ.

### 1.2. Frontend (Next.js)
- **Công nghệ cốt lõi:** Next.js 15.5.x (App Router), React 18.3.1, TypeScript.
- **Giao diện & Trải nghiệm:** Áp dụng Tailwind CSS 4.0 và Shadcn UI để xây dựng giao diện. Hiệu ứng chuyển động sử dụng Framer Motion nhằm đem lại trải nghiệm mượt mà.
- **Quản lý Trạng thái:** Zustand kết hợp với TanStack Query giúp đồng bộ trạng thái phía client và server.

### 1.3. Các Tích Hợp Hệ Sinh Thái
- **Thanh toán:** Tích hợp cổng thanh toán VNPay chuẩn hóa luồng giao dịch trực tuyến.
- **Vận chuyển:** Kết nối API Giao Hàng Nhanh (GHN) để tính phí ship theo thời gian thực.
- **Trích xuất thông tin (OCR):** Pipeline 2 lớp: Tesseract.js (tiền xử lý văn bản tại Client) kết hợp với Google Gemini AI (nhận diện chuyên sâu và ánh xạ tại Server) cho ảnh đơn thuốc.
- **Lưu trữ ảnh:** Cloudinary CDN.

---

## 2. TIẾN ĐỘ THỰC HIỆN CHI TIẾT CÁC GIAI ĐOẠN

Hệ thống đã trải qua 5 giai đoạn chính và hoàn thành xuất sắc **100% mục tiêu cốt lõi**:

- **Milestone 1: Luồng Mua Bán Cơ Bản (Core Flow) - [Đã hoàn thành]**
  - Quản lý danh mục sản phẩm (Product), theo dõi tồn kho (Inventory).
  - Xây dựng Giỏ hàng, Đặt hàng (Order) và quản lý User.
  - Tích hợp thanh toán VNPay và vận chuyển GHN.

- **Milestone 2: Kiểm Thử Toàn Diện - [Đã hoàn thành]**
  - Khắc phục các lỗi biên dịch, xử lý lỗi bảo mật vòng đời JWT.
  - Tối ưu hóa phân luồng API Gateway.

- **Milestone 3: Hệ Thống Chatbot AI Tư Vấn - [Đã hoàn thành]**
  - Đưa AI Service (FastAPI) vào hoạt động.
  - Xây dựng luồng giao tiếp Real-time stream (SSE) giữa FE và AI Service để Chatbot phản hồi mượt mà không bị ngắt quãng.

- **Milestone 4: Tối Ưu Hóa Trải Nghiệm & Cấu Trúc - [Đã hoàn thành]**
  - Tái cấu trúc giao diện Frontend với Next.js 15.5.
  - Cải tiến tốc độ tải trang và xử lý triệt để các rò rỉ bộ nhớ.

- **Milestone 5: Quản Lý Đơn Thuốc & AI OCR - [Đã hoàn thành]**
  - Xây dựng tính năng cho phép người dùng chụp/tải ảnh đơn thuốc.
  - Ứng dụng Gemini AI phân tích hình ảnh, đọc tên thuốc, liều lượng và tự động tìm kiếm thuốc trong cơ sở dữ liệu để đề xuất giỏ hàng.
  - Cung cấp giao diện riêng biệt cho Dược sĩ để kiểm duyệt đơn thuốc thông qua luồng quản lý Backend.

- **Milestone 6: Gợi Ý Sản Phẩm Thông Minh (Recommendation MVP) - [Đã hoàn thành]**
  - Xây dựng bộ máy gợi ý (Recommendation Engine) tại AI Service dựa trên hành vi người dùng (đơn hàng, giỏ hàng) và độ phổ biến.
  - Triển khai thuật toán xếp hạng (Ranking) và cơ chế Fallback đảm bảo tính liên tục của trải nghiệm khám phá sản phẩm.
  - Tích hợp widget gợi ý cá nhân hóa vào Trang chủ và các sản phẩm liên quan vào Trang chi tiết.
  - Hoàn tất kiểm chứng Backend (Contract Testing) và đảm bảo tính nhất quán của dữ liệu gợi ý.

---

## 3. CÁC LỖI VÀ VẤN ĐỀ KỸ THUẬT CẦN KHẮC PHỤC NGAY (BUGS & TECH DEBT)

Mặc dù đã hoàn thiện các tính năng cốt lõi, nhưng để chuẩn bị tốt nhất cho buổi bảo vệ đồ án, hệ thống cần xử lý một số nợ kỹ thuật và lỗi phát sinh sau:

### 3.1. Lỗi Kỹ Thuật Cần Sửa (Bugs)
1. **Lỗi Redis Serialization trong CartService:** Đang xuất hiện ngoại lệ `ClassCastException` trong log khi đọc/ghi dữ liệu Giỏ hàng. Nguyên nhân do việc cấu hình tuần tự hóa (serialization) khóa hash Redis chưa đồng nhất.
   - **Giải pháp:** Chuyển đổi và chuẩn hóa sang cấu hình `GenericJackson2JsonRedisSerializer`.
2. **Lỗi JWT Parsing Error 500:** Trong một số trường hợp khi token đã hết hạn hoặc định dạng sai, API Profile trả về lỗi `500 Internal Server Error` thay vì mã lỗi đúng là `401 Unauthorized`.
   - **Giải pháp:** Bổ sung cơ chế bắt lỗi `ExpiredJwtException` ngay tại tầng Spring Security Filter và trả về phản hồi chuẩn xác để FE xử lý làm mới (refresh) token.
3. **Bất đồng bộ Dữ Liệu Tồn Kho:** Có tình trạng trễ nhịp (race condition) nhỏ giữa số lượng hàng thực tế trên Inventory Service và hiển thị trên FE nếu có nhiều luồng thanh toán diễn ra đồng thời.
   - **Giải pháp:** Áp dụng cơ chế khóa (Pessimistic lock) trong JPA hoặc Redis distributed lock khi thực hiện nghiệp vụ trừ tồn kho.

### 3.2. Nợ Kỹ Thuật Cần Dọn Dẹp (Technical Debt)
1. **Trùng lặp DTO (Code Duplication):** Nhiều đối tượng truyền tải dữ liệu (Data Transfer Objects) đang bị khai báo lặp lại ở Order Service, Payment Service và Product Service.
   - **Giải pháp:** Di chuyển toàn bộ các DTO chung này vào module `common-lib` và tái sử dụng.
2. **Trải nghiệm Độ Trễ AI (AI Latency):** Việc gọi API ra ngoài tới Gemini để xử lý OCR đơn thuốc mất từ 3-7 giây. Hiện tại UI hiển thị trạng thái chờ khá tĩnh.
   - **Giải pháp:** Cải thiện UI loading với thông báo theo từng giai đoạn (ví dụ: "Đang phân tích hình ảnh...", "Đang đối chiếu kho hàng...") để giảm cảm giác treo hệ thống cho người dùng.

---

## 4. ĐỀ XUẤT CÁC CHỨC NĂNG PHÁT TRIỂN VÀ NÂNG CẤP

Để dự án gây ấn tượng cực mạnh với hội đồng bảo vệ và đạt tiêu chuẩn của một sản phẩm thương mại thực thụ, nhóm đề xuất các hướng phát triển mở rộng sau:

### 4.1. Về Mặt Hạ Tầng & Vận Hành (DevOps)
- **Đóng gói Docker (Dockerization):** Hệ thống đang chạy cục bộ thông qua các file script `.bat`. Đề xuất viết `Dockerfile` cho từng microservice và kết nối chúng bằng `docker-compose.yml`. Điều này giúp hệ thống triển khai được lên server Cloud dễ dàng chỉ với 1 câu lệnh.
- **Quản Trị Log Tập Trung (Centralized Logging):** Trong kiến trúc Microservices phân tán, lỗi rất khó truy vết khi luồng request đi qua nhiều service (Gateway -> Order -> Payment). Đề xuất tích hợp hệ thống **ELK Stack (Elasticsearch, Logstash, Kibana)** để gom log lại một màn hình quản trị duy nhất.
- **Cân Bằng Tải (Load Balancing):** Cấu hình chạy 2 hoặc 3 instances cho các dịch vụ nặng như `product-service`, dùng Eureka để điều phối tải. Đây sẽ là điểm nhấn xuất sắc về kiến trúc hệ thống lớn.

### 4.2. Về Mặt Tính Năng Chuyên Sâu (Features)
- **Hệ Thống Gợi Ý Bằng Vector AI (RAG Recommendation):** Xây dựng một cơ sở dữ liệu Vector (như Milvus hoặc pgvector) để lưu Embedding của sản phẩm. Khi đó Chatbot AI không chỉ tư vấn chung chung mà có thể trích xuất chính xác các sản phẩm đang có trong kho để gợi ý (Retrieval-Augmented Generation).
- **Phân Tích Dữ Liệu & Dashboard Quản Trị:** Xây dựng một Admin Dashboard hoàn chỉnh để vẽ biểu đồ trực quan hóa doanh thu, và thống kê tỷ lệ AI phân tích đơn thuốc thành công.
- **Thông Báo Bất Đồng Bộ (Message Broker):** Áp dụng RabbitMQ hoặc Apache Kafka thay thế cho việc gọi API đồng bộ trong các tác vụ gửi Email xác nhận, nhằm giảm thời gian phản hồi ở khâu Thanh toán.
- **Tự Động Hóa Kiểm Thử (E2E Test Automation):** Viết hoàn chỉnh bộ kịch bản tự động bằng thư viện Playwright (đã cài đặt sẵn ở thư mục `FE/e2e`) để tự động chạy luồng: *Đăng nhập -> Tải đơn thuốc OCR -> Bỏ giỏ hàng -> Thanh toán Sandbox* phục vụ trình diễn.

---
**KẾT LUẬN:** Hệ thống MedCare hiện tại đã đáp ứng hoàn toàn khối lượng công việc khổng lồ của một đồ án tốt nghiệp với kiến trúc công nghệ tiên tiến (Microservices đa ngôn ngữ, tích hợp AI). Bằng việc tập trung giải quyết các lỗi tồn đọng nhỏ và hoàn thiện khâu triển khai bằng Docker, dự án chắc chắn sẽ đạt chất lượng xuất sắc.
