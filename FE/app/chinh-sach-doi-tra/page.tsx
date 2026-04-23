import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PackageCheck } from "lucide-react"

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Chính sách đổi trả</h1>
            <p className="text-muted-foreground mb-8">Cập nhật lần cuối: 15/12/2024</p>

            <Alert className="mb-8 border-primary/20 bg-primary/5">
              <PackageCheck className="h-4 w-4 text-primary" />
              <AlertDescription>
                MedCare cam kết đổi trả hàng nhanh chóng trong vòng 7 ngày nếu sản phẩm có vấn đề về chất lượng hoặc
                giao sai.
              </AlertDescription>
            </Alert>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>1. Điều kiện đổi trả</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>Sản phẩm được chấp nhận đổi trả khi đáp ứng các điều kiện sau:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Sản phẩm bị lỗi do nhà sản xuất</li>
                  <li>Sản phẩm giao sai so với đơn hàng</li>
                  <li>Sản phẩm hư hỏng trong quá trình vận chuyển</li>
                  <li>Sản phẩm không đúng chất lượng như mô tả</li>
                  <li>Sản phẩm còn nguyên tem, mác, bao bì</li>
                  <li>Sản phẩm chưa qua sử dụng</li>
                  <li>Có hóa đơn mua hàng hợp lệ</li>
                  <li>Trong thời hạn 7 ngày kể từ ngày nhận hàng</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>2. Sản phẩm không được đổi trả</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>Các trường hợp sau KHÔNG được chấp nhận đổi trả:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Thuốc kê đơn đã được phát hành (theo quy định Bộ Y tế)</li>
                  <li>Sản phẩm đã qua sử dụng</li>
                  <li>Sản phẩm mất tem, mác, bao bì</li>
                  <li>Sản phẩm hư hỏng do người mua</li>
                  <li>Sản phẩm mua trong chương trình khuyến mãi đặc biệt (có ghi chú không đổi trả)</li>
                  <li>Sản phẩm mua qua kênh không chính thức của MedCare</li>
                  <li>Quá thời hạn 7 ngày đổi trả</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>3. Quy trình đổi trả</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <strong>Bước 1: Liên hệ với chúng tôi</strong>
                </p>
                <p className="text-muted-foreground ml-4">
                  Gọi hotline 1900 xxxx hoặc gửi email về support@medcare.vn trong vòng 7 ngày kể từ ngày nhận hàng.
                  Cung cấp mã đơn hàng, hình ảnh sản phẩm và mô tả vấn đề.
                </p>

                <p>
                  <strong>Bước 2: Xác nhận yêu cầu</strong>
                </p>
                <p className="text-muted-foreground ml-4">
                  Bộ phận chăm sóc khách hàng sẽ xem xét và xác nhận yêu cầu của bạn trong vòng 24 giờ làm việc.
                </p>

                <p>
                  <strong>Bước 3: Gửi hàng trả</strong>
                </p>
                <p className="text-muted-foreground ml-4">
                  Đóng gói sản phẩm cẩn thận, giữ nguyên bao bì. Chúng tôi sẽ sắp xếp đơn vị vận chuyển đến lấy hàng
                  hoặc bạn có thể gửi qua bưu điện (phí ship hoàn lại nếu lỗi từ chúng tôi).
                </p>

                <p>
                  <strong>Bước 4: Kiểm tra và xử lý</strong>
                </p>
                <p className="text-muted-foreground ml-4">
                  Sau khi nhận hàng, chúng tôi kiểm tra trong vòng 2-3 ngày làm việc. Nếu đủ điều kiện, bạn sẽ nhận được
                  sản phẩm mới hoặc hoàn tiền.
                </p>

                <p>
                  <strong>Bước 5: Hoàn tất</strong>
                </p>
                <p className="text-muted-foreground ml-4">
                  Sản phẩm đổi mới được giao trong 2-3 ngày. Hoàn tiền được xử lý trong 5-7 ngày làm việc.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>4. Phương thức hoàn tiền</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <strong>4.1 Thanh toán COD:</strong> Hoàn tiền qua chuyển khoản ngân hàng theo thông tin bạn cung cấp.
                </p>
                <p>
                  <strong>4.2 Thanh toán online:</strong> Hoàn tiền về tài khoản/thẻ gốc trong vòng 5-7 ngày làm việc.
                </p>
                <p>
                  <strong>4.3 Ví MedCare:</strong> Hoàn vào ví điện tử MedCare để sử dụng cho lần mua sau (nhanh nhất).
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>5. Chi phí đổi trả</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <strong>5.1 Lỗi từ MedCare:</strong> Chúng tôi chịu toàn bộ chi phí vận chuyển đổi trả.
                </p>
                <p>
                  <strong>5.2 Khách hàng đổi ý:</strong> Khách hàng chịu phí vận chuyển (không áp dụng cho thuốc và sản
                  phẩm đặc biệt).
                </p>
                <p>
                  <strong>5.3 Lỗi vận chuyển:</strong> Chúng tôi phối hợp với đơn vị vận chuyển để xử lý và bồi thường.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>6. Trường hợp đặc biệt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <strong>6.1 Thuốc hết hạn:</strong> Nếu nhận được thuốc hết hạn hoặc sắp hết hạn (dưới 6 tháng), vui
                  lòng liên hệ ngay. Chúng tôi sẽ đổi mới và bồi thường.
                </p>
                <p>
                  <strong>6.2 Thiếu sản phẩm:</strong> Nếu đơn hàng thiếu sản phẩm, chúng tôi sẽ giao bổ sung miễn phí
                  trong 48h.
                </p>
                <p>
                  <strong>6.3 Tư vấn sai:</strong> Nếu bạn mua sản phẩm dựa trên tư vấn của dược sĩ và không phù hợp,
                  liên hệ để được hỗ trợ đổi sản phẩm khác.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>7. Bảo hành sản phẩm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  <strong>Thiết bị y tế:</strong> Được bảo hành theo chính sách của nhà sản xuất (thường 12-24 tháng).
                </p>
                <p>
                  <strong>Máy đo huyết áp, nhiệt kế:</strong> Bảo hành 12 tháng đổi mới nếu lỗi kỹ thuật.
                </p>
                <p>Để được bảo hành, vui lòng giữ hóa đơn mua hàng và phiếu bảo hành (nếu có).</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Liên hệ hỗ trợ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>Để được hỗ trợ đổi trả, vui lòng liên hệ:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Hotline: 1900 xxxx (8:00 - 20:00 hàng ngày)</li>
                  <li>Email: support@medcare.vn</li>
                  <li>Chat trực tuyến trên website</li>
                  <li>Fanpage: facebook.com/medcare.vn</li>
                </ul>
                <p className="mt-4">
                  <strong>Lưu ý:</strong> Thời gian xử lý có thể kéo dài hơn trong các dịp lễ, tết. Chúng tôi sẽ thông
                  báo trước nếu có thay đổi.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
