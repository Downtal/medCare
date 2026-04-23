import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Phone, Mail, Clock } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Liên hệ với chúng tôi</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Đội ngũ dược sĩ và chăm sóc khách hàng của MedCare luôn sẵn sàng hỗ trợ bạn 24/7
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin liên hệ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Địa chỉ</h3>
                        <p className="text-sm text-muted-foreground">
                          123 Đường Nguyễn Huệ, Phường Bến Nghé
                          <br />
                          Quận 1, TP. Hồ Chí Minh
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Điện thoại</h3>
                        <p className="text-sm text-muted-foreground">
                          Hotline: 1900 xxxx
                          <br />
                          Tư vấn dược sĩ: 0912 345 678
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <p className="text-sm text-muted-foreground">
                          Hỗ trợ khách hàng: support@medcare.vn
                          <br />
                          Tư vấn dược sĩ: pharmacist@medcare.vn
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Giờ làm việc</h3>
                        <p className="text-sm text-muted-foreground">
                          Thứ 2 - Thứ 7: 8:00 - 20:00
                          <br />
                          Chủ nhật: 8:00 - 18:00
                          <br />
                          Tư vấn online: 24/7
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Câu hỏi thường gặp</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="ghost" className="w-full justify-start text-left h-auto py-3 px-4">
                      <div>
                        <p className="font-medium">Làm sao để mua thuốc kê đơn?</p>
                        <p className="text-sm text-muted-foreground">Bạn cần tải lên toa thuốc hợp lệ từ bác sĩ...</p>
                      </div>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-left h-auto py-3 px-4">
                      <div>
                        <p className="font-medium">Thời gian giao hàng là bao lâu?</p>
                        <p className="text-sm text-muted-foreground">Giao hàng tiêu chuẩn 2-3 ngày...</p>
                      </div>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-left h-auto py-3 px-4">
                      <div>
                        <p className="font-medium">Chính sách đổi trả như thế nào?</p>
                        <p className="text-sm text-muted-foreground">Đổi trả trong 7 ngày nếu sản phẩm...</p>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Gửi tin nhắn cho chúng tôi</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên *</Label>
                        <Input id="name" placeholder="Nguyễn Văn A" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại *</Label>
                        <Input id="phone" type="tel" placeholder="0912 345 678" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" placeholder="example@email.com" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Chủ đề</Label>
                      <Input id="subject" placeholder="Tôi muốn hỏi về..." />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Nội dung *</Label>
                      <Textarea id="message" placeholder="Nhập nội dung tin nhắn..." rows={6} />
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      Gửi tin nhắn
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-border bg-secondary">
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <MapPin className="h-12 w-12 mb-2" />
                <span className="ml-2">Bản đồ vị trí cửa hàng</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
