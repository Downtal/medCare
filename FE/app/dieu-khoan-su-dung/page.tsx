import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Điều khoản sử dụng</h1>
            <p className="text-muted-foreground mb-8">Cập nhật lần cuối: 15/12/2024</p>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>1. Giới thiệu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  Chào mừng bạn đến với MedCare. Khi sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản
                  và điều kiện sau đây. Vui lòng đọc kỹ trước khi sử dụng.
                </p>
                <p>
                  MedCare là nền tảng thương mại điện tử chuyên cung cấp dược phẩm, thực phẩm chức năng và thiết bị y
                  tế. Chúng tôi cam kết cung cấp sản phẩm chính hãng, chất lượng cao với giá cả hợp lý.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>2. Tài khoản người dùng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <strong>2.1 Đăng ký tài khoản:</strong> Bạn cần cung cấp thông tin chính xác, đầy đủ khi đăng ký tài
                  khoản. Mỗi người chỉ được tạo một tài khoản duy nhất.
                </p>
                <p>
                  <strong>2.2 Bảo mật tài khoản:</strong> Bạn có trách nhiệm bảo vệ thông tin đăng nhập và thông báo
                  ngay cho chúng tôi nếu phát hiện bất kỳ hành vi truy cập trái phép nào.
                </p>
                <p>
                  <strong>2.3 Độ tuổi:</strong> Người dùng phải đủ 18 tuổi trở lên để đặt hàng thuốc kê đơn. Đối với
                  thuốc không kê đơn, người dưới 18 tuổi cần có sự đồng ý của người giám hộ.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>3. Đặt hàng và thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <strong>3.1 Quy trình đặt hàng:</strong> Khách hàng chọn sản phẩm, thêm vào giỏ hàng và tiến hành
                  thanh toán. Đơn hàng được xác nhận khi thanh toán thành công.
                </p>
                <p>
                  <strong>3.2 Giá cả:</strong> Giá sản phẩm có thể thay đổi mà không cần báo trước. Giá áp dụng là giá
                  tại thời điểm đặt hàng.
                </p>
                <p>
                  <strong>3.3 Phương thức thanh toán:</strong> Chúng tôi chấp nhận thanh toán qua COD, thẻ ngân hàng, ví
                  điện tử và chuyển khoản.
                </p>
                <p>
                  <strong>3.4 Hủy đơn:</strong> Khách hàng có thể hủy đơn hàng trước khi đơn được xử lý. Sau khi đã giao
                  hàng, áp dụng chính sách đổi trả.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>4. Thuốc kê đơn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <strong>4.1 Toa thuốc hợp lệ:</strong> Khách hàng mua thuốc kê đơn phải cung cấp toa thuốc hợp lệ từ
                  bác sĩ có thẩm quyền.
                </p>
                <p>
                  <strong>4.2 Xác minh:</strong> Dược sĩ của MedCare có quyền từ chối đơn hàng nếu toa thuốc không hợp
                  lệ hoặc không rõ ràng.
                </p>
                <p>
                  <strong>4.3 Trách nhiệm:</strong> Khách hàng chịu trách nhiệm về việc sử dụng thuốc theo chỉ dẫn của
                  bác sĩ. MedCare không chịu trách nhiệm về việc sử dụng sai chỉ định.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>5. Giao hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <strong>5.1 Thời gian giao hàng:</strong> Giao hàng tiêu chuẩn trong 2-3 ngày làm việc. Giao nhanh
                  trong ngày tại các khu vực hỗ trợ.
                </p>
                <p>
                  <strong>5.2 Phí vận chuyển:</strong> Miễn phí vận chuyển cho đơn hàng từ 300.000đ. Phí vận chuyển được
                  tính dựa trên khoảng cách và trọng lượng.
                </p>
                <p>
                  <strong>5.3 Nhận hàng:</strong> Khách hàng cần kiểm tra hàng khi nhận. Nếu phát hiện sai sót, vui lòng
                  từ chối nhận và liên hệ ngay với chúng tôi.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>6. Quyền và nghĩa vụ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <strong>6.1 Quyền của khách hàng:</strong> Được cung cấp thông tin đầy đủ về sản phẩm, được tư vấn
                  miễn phí, được đổi trả hàng theo chính sách.
                </p>
                <p>
                  <strong>6.2 Nghĩa vụ của khách hàng:</strong> Cung cấp thông tin chính xác, thanh toán đúng hạn, sử
                  dụng thuốc theo chỉ định.
                </p>
                <p>
                  <strong>6.3 Quyền của MedCare:</strong> Từ chối giao dịch không hợp lệ, thay đổi điều khoản khi cần
                  thiết, thu thập thông tin để cải thiện dịch vụ.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>7. Giới hạn trách nhiệm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  MedCare không chịu trách nhiệm về các tổn thất phát sinh từ việc sử dụng sai chỉ định, phản ứng phụ
                  không thể lường trước, hoặc các yếu tố ngoài tầm kiểm soát như thiên tai, dịch bệnh.
                </p>
                <p>
                  Thông tin trên website chỉ mang tính tham khảo, không thay thế tư vấn y tế chuyên nghiệp. Vui lòng
                  tham khảo ý kiến bác sĩ trước khi sử dụng.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>8. Thay đổi điều khoản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  MedCare có quyền thay đổi, bổ sung điều khoản sử dụng bất kỳ lúc nào. Các thay đổi có hiệu lực ngay
                  khi được đăng tải trên website. Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với
                  việc bạn chấp nhận các điều khoản mới.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Liên hệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>Nếu bạn có bất kỳ câu hỏi nào về điều khoản sử dụng, vui lòng liên hệ với chúng tôi qua:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Email: support@medcare.vn</li>
                  <li>Hotline: 1900 xxxx</li>
                  <li>Địa chỉ: 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
