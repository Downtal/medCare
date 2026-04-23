import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, Award, Clock } from "lucide-react"

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: "An toàn & Tin cậy",
      description: "Cam kết 100% sản phẩm chính hãng, có nguồn gốc rõ ràng được kiểm định chất lượng",
    },
    {
      icon: Users,
      title: "Tư vấn chuyên nghiệp",
      description: "Đội ngũ dược sĩ giàu kinh nghiệm sẵn sàng tư vấn miễn phí 24/7",
    },
    {
      icon: Award,
      title: "Chất lượng hàng đầu",
      description: "Đạt chuẩn GPP, ISO và các chứng nhận chất lượng quốc tế",
    },
    {
      icon: Clock,
      title: "Giao hàng nhanh chóng",
      description: "Giao hàng trong 2-3 ngày, miễn phí ship cho đơn từ 300.000đ",
    },
  ]

  const milestones = [
    { year: "2018", event: "Thành lập MedCare với cửa hàng đầu tiên tại TP.HCM" },
    { year: "2019", event: "Mở rộng 10 chi nhánh trên toàn quốc" },
    { year: "2020", event: "Ra mắt nền tảng mua thuốc online" },
    { year: "2021", event: "Đạt chứng nhận GPP và ISO 9001" },
    { year: "2022", event: "Phục vụ hơn 500,000 khách hàng" },
    { year: "2024", event: "Mở rộng 50+ chi nhánh và trung tâm tư vấn 24/7" },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4">Về chúng tôi</Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              Nhà thuốc uy tín, chăm sóc sức khỏe toàn diện
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-pretty">
              MedCare được thành lập với sứ mệnh mang đến giải pháp chăm sóc sức khỏe tiện lợi, an toàn và chất lượng
              cao cho mọi người Việt Nam
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Giá trị cốt lõi</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6 text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground text-balance">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-4">Sứ mệnh</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Cung cấp dịch vụ chăm sóc sức khỏe toàn diện, tiện lợi và đáng tin cậy. Chúng tôi cam kết mang đến
                    những sản phẩm chất lượng cao cùng tư vấn chuyên nghiệp từ đội ngũ dược sĩ giàu kinh nghiệm.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-4">Tầm nhìn</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Trở thành nền tảng chăm sóc sức khỏe trực tuyến hàng đầu Việt Nam, nơi mọi người có thể dễ dàng tiếp
                    cận các sản phẩm y tế chất lượng và nhận được tư vấn sức khỏe chuyên nghiệp mọi lúc, mọi nơi.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Hành trình phát triển</h2>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                {milestones.map((milestone, idx) => (
                  <div key={idx} className="flex gap-6">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                        {milestone.year.slice(2)}
                      </div>
                      {idx < milestones.length - 1 && (
                        <div className="absolute left-1/2 top-12 bottom-0 w-0.5 bg-border -translate-x-1/2" />
                      )}
                    </div>
                    <Card className="flex-1">
                      <CardContent className="py-4">
                        <p className="font-semibold text-primary mb-1">{milestone.year}</p>
                        <p className="text-sm text-muted-foreground">{milestone.event}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold mb-2">500K+</p>
                <p className="text-sm opacity-90">Khách hàng tin tưởng</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">50+</p>
                <p className="text-sm opacity-90">Chi nhánh toàn quốc</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">10K+</p>
                <p className="text-sm opacity-90">Sản phẩm đa dạng</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">24/7</p>
                <p className="text-sm opacity-90">Tư vấn dược sĩ</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
