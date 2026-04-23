import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Chính sách bảo mật</h1>
            <p className="text-muted-foreground mb-8">Cập nhật lần cuối: 15/12/2024</p>

            <Alert className="mb-8 border-primary/20 bg-primary/5">
              <Shield className="h-4 w-4 text-primary" />
              <AlertDescription>
                MedCare cam kết bảo vệ thông tin cá nhân của bạn. Chúng tôi tuân thủ nghiêm ngặt các quy định về bảo vệ
                dữ liệu cá nhân theo pháp luật Việt Nam.
              </AlertDescription>
            </Alert>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>1. Thông tin chúng tôi thu thập</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <strong>1.1 Thông tin cá nhân:</strong> Họ tên, số điện thoại, email, địa chỉ giao hàng, ngày sinh,
                  giới tính.
                </p>
                <p>
                  <strong>1.2 Thông tin y tế:</strong> Toa thuốc, lịch sử mua hàng, thông tin sức khỏe (nếu bạn cung cấp
                  khi tư vấn).
                </p>
                <p>
                  <strong>1.3 Thông tin thanh toán:</strong> Thông tin thẻ ngân hàng, ví điện tử (được mã hóa bởi nhà
                  cung cấp dịch vụ thanh toán).
                </p>
                <p>
                  <strong>1.4 Thông tin kỹ thuật:</strong> Địa chỉ IP, loại trình duyệt, thiết bị, thời gian truy cập,
                  cookies.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>2. Mục đích sử dụng thông tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>Chúng tôi sử dụng thông tin của bạn để:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Xử lý đơn hàng và giao hàng</li>
                  <li>Xác minh toa thuốc và tư vấn dược sĩ</li>
                  <li>Gửi thông báo về đơn hàng, khuyến mãi</li>
                  <li>Cải thiện chất lượng dịch vụ</li>
                  <li>Phân tích hành vi người dùng</li>
                  <li>Tuân thủ các quy định pháp luật</li>
                  <li>Ngăn chặn gian lận và bảo vệ an ninh</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>3. Bảo mật thông tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <strong>3.1 Mã hóa:</strong> Toàn bộ thông tin nhạy cảm được mã hóa bằng SSL/TLS khi truyền tải.
                </p>
                <p>
                  <strong>3.2 Kiểm soát truy cập:</strong> Chỉ nhân viên được ủy quyền mới có quyền truy cập thông tin
                  cá nhân của bạn.
                </p>
                <p>
                  <strong>3.3 Giám sát:</strong> Hệ thống được giám sát 24/7 để phát hiện và ngăn chặn truy cập trái
                  phép.
                </p>
                <p>
                  <strong>3.4 Sao lưu:</strong> Dữ liệu được sao lưu định kỳ và lưu trữ an toàn.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>4. Chia sẻ thông tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>Chúng tôi chỉ chia sẻ thông tin của bạn với:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    <strong>Đơn vị vận chuyển:</strong> Tên, số điện thoại, địa chỉ giao hàng
                  </li>
                  <li>
                    <strong>Cổng thanh toán:</strong> Thông tin thanh toán (được mã hóa)
                  </li>
                  <li>
                    <strong>Cơ quan nhà nước:</strong> Khi có yêu cầu hợp pháp
                  </li>
                  <li>
                    <strong>Đối tác dịch vụ:</strong> Với sự đồng ý của bạn
                  </li>
                </ul>
                <p className="mt-4">
                  Chúng tôi KHÔNG bán hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba vì mục đích thương mại.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>5. Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  Chúng tôi sử dụng cookies để cải thiện trải nghiệm người dùng, ghi nhớ tùy chọn của bạn, phân tích lưu
                  lượng truy cập. Bạn có thể từ chối cookies trong cài đặt trình duyệt, nhưng một số tính năng có thể
                  không hoạt động đúng.
                </p>
                <p>
                  <strong>Loại cookies chúng tôi sử dụng:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Cookies cần thiết: Để website hoạt động</li>
                  <li>Cookies phân tích: Để hiểu cách bạn sử dụng website</li>
                  <li>Cookies tiếp thị: Để hiển thị quảng cáo phù hợp</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>6. Quyền của bạn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>Bạn có quyền:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Truy cập và xem thông tin cá nhân của bạn</li>
                  <li>Yêu cầu chỉnh sửa thông tin không chính xác</li>
                  <li>Yêu cầu xóa thông tin cá nhân</li>
                  <li>Rút lại sự đồng ý đã cung cấp</li>
                  <li>Từ chối nhận email marketing</li>
                  <li>Khiếu nại về việc xử lý dữ liệu</li>
                </ul>
                <p className="mt-4">
                  Để thực hiện các quyền trên, vui lòng liên hệ với chúng tôi qua email: privacy@medcare.vn
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>7. Lưu trữ thông tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  Chúng tôi lưu trữ thông tin của bạn trong thời gian cần thiết để cung cấp dịch vụ và tuân thủ pháp
                  luật. Thông tin y tế được lưu trữ theo quy định của Bộ Y tế.
                </p>
                <p>Sau khi bạn yêu cầu xóa tài khoản, thông tin sẽ được xóa trong vòng 30 ngày.</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>8. Bảo vệ trẻ em</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  Dịch vụ của chúng tôi không dành cho trẻ em dưới 13 tuổi. Chúng tôi không cố ý thu thập thông tin từ
                  trẻ em. Nếu bạn là phụ huynh và phát hiện con bạn đã cung cấp thông tin, vui lòng liên hệ với chúng
                  tôi.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>9. Thay đổi chính sách</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Các thay đổi quan trọng sẽ được thông
                  báo qua email hoặc thông báo trên website. Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng
                  nghĩa với việc bạn chấp nhận chính sách mới.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Liên hệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>Nếu bạn có câu hỏi về chính sách bảo mật, vui lòng liên hệ:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Email bảo mật: privacy@medcare.vn</li>
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
