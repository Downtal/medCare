import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Phone, MessageCircle, Video, Clock, CheckCircle, Stethoscope, Mail } from "lucide-react"
import Image from "next/image"

const pharmacists = [
  {
    id: 1,
    name: "Dược sĩ Nguyễn Văn An",
    title: "Dược sĩ cao cấp",
    experience: "15 năm kinh nghiệm",
    specialty: "Thuốc kê đơn, bệnh mãn tính",
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.9,
    consultations: 1250,
    available: true,
  },
  {
    id: 2,
    name: "Dược sĩ Trần Thị Bình",
    title: "Dược sĩ chuyên khoa",
    experience: "12 năm kinh nghiệm",
    specialty: "Da liễu, dị ứng",
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.8,
    consultations: 980,
    available: true,
  },
  {
    id: 3,
    name: "Dược sĩ Lê Minh Châu",
    title: "Dược sĩ",
    experience: "8 năm kinh nghiệm",
    specialty: "Dinh dưỡng, vitamin",
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.7,
    consultations: 650,
    available: false,
  },
]

const consultationMethods = [
  {
    icon: MessageCircle,
    title: "Chat Trực Tuyến",
    description: "Tư vấn qua tin nhắn văn bản",
    time: "Phản hồi trong 5 phút",
    price: "Miễn phí",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Phone,
    title: "Gọi Điện Thoại",
    description: "Tư vấn qua cuộc gọi điện thoại",
    time: "Trả lời ngay lập tức",
    price: "Miễn phí",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Video,
    title: "Video Call",
    description: "Tư vấn qua video trực tiếp",
    time: "Đặt lịch trước 30 phút",
    price: "50.000đ/15 phút",
    color: "bg-purple-50 text-purple-600",
  },
]

const faqItems = [
  {
    question: "Tôi có thể tư vấn về thuốc kê đơn không?",
    answer:
      "Có, dược sĩ của chúng tôi có thể tư vấn về thuốc kê đơn. Tuy nhiên, để mua thuốc kê đơn, bạn cần có đơn thuốc hợp lệ từ bác sĩ.",
  },
  {
    question: "Dịch vụ tư vấn có mất phí không?",
    answer:
      "Tư vấn qua chat và điện thoại hoàn toàn miễn phí. Chỉ có dịch vụ tư vấn video call mới có phí 50.000đ/15 phút.",
  },
  {
    question: "Thời gian làm việc của dược sĩ?",
    answer: "Dược sĩ của chúng tôi làm việc từ 8:00 - 22:00 hàng ngày, kể cả cuối tuần và ngày lễ.",
  },
  {
    question: "Tôi có thể đặt lịch tư vấn không?",
    answer: "Có, bạn có thể đặt lịch tư vấn video call trước. Với chat và điện thoại, bạn có thể tư vấn ngay lập tức.",
  },
]

export default function ConsultationPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 mb-4">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Tư vấn miễn phí 24/7</span>
                </div>
                <h1 className="text-balance text-3xl font-bold text-primary md:text-4xl">
                  Tư Vấn Dược Sĩ Chuyên Nghiệp
                </h1>
                <p className="mt-4 text-pretty text-muted-foreground">
                  Đội ngũ dược sĩ giàu kinh nghiệm sẵn sàng tư vấn về thuốc, liều lượng, tác dụng phụ và cách sử dụng an
                  toàn. Hoàn toàn miễn phí và bảo mật.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <Button size="lg" asChild>
                    <a href="#contact-form">Tư Vấn Ngay</a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="tel:19001234">
                      <Phone className="mr-2 h-5 w-5" />
                      1900 1234
                    </a>
                  </Button>
                </div>

                {/* Stats */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-border bg-background p-4 text-center">
                    <div className="text-2xl font-bold text-primary">5000+</div>
                    <div className="text-xs text-muted-foreground">Tư vấn/tháng</div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4 text-center">
                    <div className="text-2xl font-bold text-primary">4.8/5</div>
                    <div className="text-xs text-muted-foreground">Đánh giá</div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4 text-center">
                    <div className="text-2xl font-bold text-primary">24/7</div>
                    <div className="text-xs text-muted-foreground">Hỗ trợ</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Image
                  src="/placeholder.svg?height=500&width=600"
                  alt="Dược sĩ tư vấn"
                  width={600}
                  height={500}
                  className="rounded-2xl shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Consultation Methods */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-primary">Hình Thức Tư Vấn</h2>
              <p className="mt-2 text-muted-foreground">Chọn hình thức tư vấn phù hợp với bạn</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {consultationMethods.map((method, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-background p-6 transition-all hover:shadow-lg"
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${method.color}`}>
                    <method.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{method.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{method.description}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{method.time}</span>
                    </div>
                    <div className="text-lg font-bold text-primary">{method.price}</div>
                  </div>
                  <Button className="mt-4 w-full" variant={index === 2 ? "default" : "outline"}>
                    Chọn
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Pharmacists */}
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-primary">Đội Ngũ Dược Sĩ</h2>
              <p className="mt-2 text-muted-foreground">Dược sĩ chuyên nghiệp, tận tâm với khách hàng</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {pharmacists.map((pharmacist) => (
                <div key={pharmacist.id} className="rounded-xl border border-border bg-background p-6">
                  <div className="relative">
                    <Image
                      src={pharmacist.image || "/placeholder.svg"}
                      alt={pharmacist.name}
                      width={200}
                      height={200}
                      className="mx-auto rounded-full"
                    />
                    {pharmacist.available && (
                      <Badge className="absolute bottom-2 right-1/4 bg-green-500">
                        <span className="mr-1">●</span> Đang hoạt động
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-semibold text-foreground">{pharmacist.name}</h3>
                    <p className="text-sm text-muted-foreground">{pharmacist.title}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{pharmacist.experience}</p>
                    <p className="mt-1 text-sm font-medium text-primary">{pharmacist.specialty}</p>
                    <div className="mt-3 flex items-center justify-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{pharmacist.rating}</span>
                      </div>
                      <div className="text-muted-foreground">{pharmacist.consultations} tư vấn</div>
                    </div>
                    <Button className="mt-4 w-full" disabled={!pharmacist.available}>
                      {pharmacist.available ? "Tư Vấn Ngay" : "Không khả dụng"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact-form" className="py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-xl border border-border bg-background p-8">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-primary">Gửi Câu Hỏi Tư Vấn</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Dược sĩ sẽ phản hồi trong vòng 5 phút trong giờ làm việc
                  </p>
                </div>

                <form className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <Input id="name" placeholder="Nguyễn Văn A" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <Input id="phone" type="tel" placeholder="0912345678" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input id="email" type="email" placeholder="email@example.com" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">
                      Chủ đề tư vấn <span className="text-red-500">*</span>
                    </label>
                    <Input id="subject" placeholder="VD: Hỏi về liều dùng thuốc" required />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Nội dung câu hỏi <span className="text-red-500">*</span>
                    </label>
                    <Textarea id="message" placeholder="Mô tả chi tiết câu hỏi của bạn..." rows={5} required />
                  </div>

                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Thông tin của bạn được bảo mật tuyệt đối. Dược sĩ sẽ liên hệ sớm nhất có thể.
                      </p>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    <Mail className="mr-2 h-5 w-5" />
                    Gửi Câu Hỏi
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-primary">Câu Hỏi Thường Gặp</h2>
              </div>
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <div key={index} className="rounded-xl border border-border bg-background p-6">
                    <h3 className="font-semibold text-foreground">{item.question}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
              <h3 className="text-2xl font-bold text-primary">Cần Tư Vấn Ngay?</h3>
              <p className="mt-3 text-muted-foreground">Gọi hotline hoặc chat với dược sĩ để nhận tư vấn nhanh nhất</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <a href="tel:19001234">
                    <Phone className="mr-2 h-5 w-5" />
                    Gọi 1900 1234
                  </a>
                </Button>
                <Button size="lg" variant="outline">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Chat Ngay
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
