"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Phone,
  MessageSquare,
  Video,
  Clock,
  CheckCircle,
  Stethoscope,
  Mail,
  Star,
  ShieldCheck,
  Users,
  ArrowRight,
  Send,
  Zap,
  User2
} from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

const pharmacists = [
  {
    id: 1,
    name: "Dược sĩ Nguyễn Văn An",
    title: "Dược sĩ cao cấp",
    experience: "15 năm kinh nghiệm",
    specialty: "Thuốc kê đơn, bệnh mãn tính",
    image: null,
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
    image: null,
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
    image: null,
    rating: 4.7,
    consultations: 650,
    available: false,
  },
]

const consultationMethods = [
  {
    icon: MessageSquare,
    title: "Chat Trực Tuyến",
    description: "Tư vấn qua tin nhắn văn bản, hình ảnh toa thuốc.",
    time: "Phản hồi < 5 phút",
    price: "Miễn phí",
    color: "blue",
  },
  {
    icon: Phone,
    title: "Gọi Điện Thoại",
    description: "Kết nối trực tiếp qua tổng đài ưu tiên.",
    time: "Kết nối ngay",
    price: "Miễn phí",
    color: "green",
  },
  {
    icon: Video,
    title: "Video Call",
    description: "Tư vấn trực quan sinh động 1-1.",
    time: "Đặt lịch trước",
    price: "Miễn phí",
    color: "purple",
  },
]

export default function ConsultationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1">

        {/* Modern Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-1/3 h-full bg-accent/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
          </div>

          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full bg-primary/10 text-primary border-none font-black text-xs uppercase tracking-widest">
                  <Zap className="w-3 h-3 mr-2 fill-current" />
                  Phản hồi trong vòng 60 giây
                </Badge>
                <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-slate-900 tracking-tight">
                  Tư vấn chuyên sâu <br /> cùng <span className="text-primary italic">Dược sĩ MedCare</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl font-medium">
                  Giải đáp mọi thắc mắc về thuốc, cách phối hợp điều trị và dinh dưỡng. An tâm tuyệt đối với đội ngũ dược sĩ đạt chuẩn quốc tế.
                </p>

                <div className="flex flex-wrap gap-4 mb-12">
                  <Button size="lg" className="rounded-2xl px-10 h-16 text-lg font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    Tư vấn ngay <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-2xl px-10 h-16 text-lg font-black border-2 bg-white transition-all hover:bg-slate-50">
                    Xem hồ sơ dược sĩ
                  </Button>
                </div>

                <div className="flex items-center gap-12 pt-8 border-t border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-slate-900">10k+</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Ca tư vấn/tháng</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-slate-900">4.9/5</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Độ hài lòng</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-slate-900">24/7</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Luôn sẵn sàng</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative hidden lg:block"
              >
                <div className="relative aspect-[4/5] rounded-[60px] overflow-hidden shadow-2xl shadow-blue-900/10 border-8 border-white group">
                  <Image
                    src="/pharmacist-consult.png"
                    alt="Pharmacist"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
                    <p className="text-white font-black text-xl mb-1">Dược sĩ Nguyễn Văn An</p>
                    <p className="text-white/80 font-medium text-sm">Trưởng bộ phận tư vấn chuyên môn MedCare</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Methods Grid */}
        <section className="py-24 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Đa dạng hình thức kết nối</h2>
              <p className="text-slate-500 font-medium text-lg">Chúng tôi tối ưu hóa mọi kênh liên lạc để bạn nhận được lời khuyên y tế nhanh nhất.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {consultationMethods.map((method, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -10 }}
                  className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 transition-all hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 group"
                >
                  <div className={`w-16 h-16 bg-${method.color}-100 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-${method.color}-600 group-hover:text-white transition-all`}>
                    <method.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{method.title}</h3>
                  <p className="text-slate-500 font-medium mb-8 leading-relaxed">{method.description}</p>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{method.time}</p>
                      <p className={`text-lg font-black text-${method.color}-600`}>{method.price}</p>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-2 font-bold px-6">Bắt đầu</Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pharmacists Showcase */}
        <section className="py-24 bg-slate-50/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Gặp gỡ chuyên gia</h2>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">Đội ngũ dược sĩ MedCare đều sở hữu chứng chỉ hành nghề và tối thiểu 5 năm kinh nghiệm thực tiễn.</p>
              </div>
              <Button variant="link" className="text-primary font-black text-lg group p-0">
                Tất cả dược sĩ <ChevronRight className="ml-1 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
              {pharmacists.map((pharma, i) => (
                <motion.div
                  key={pharma.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all"
                >
                  <div className="relative w-full aspect-square rounded-[32px] overflow-hidden mb-8 bg-slate-100 flex items-center justify-center">
                    {pharma.image ? (
                      <Image src={pharma.image} alt={pharma.name} fill className="object-cover" />
                    ) : (
                      <User2 className="w-20 h-20 text-slate-300" />
                    )}
                    {pharma.available ? (
                      <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        TRỰC TUYẾN
                      </div>
                    ) : (
                      <div className="absolute top-4 right-4 bg-slate-400 text-white text-[10px] font-black px-3 py-1.5 rounded-full">NGOẠI TUYẾN</div>
                    )}
                  </div>

                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-slate-900 mb-1">{pharma.name}</h3>
                    <p className="text-primary font-bold text-sm mb-4">{pharma.title}</p>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-full">
                        <Star className="w-3 h-3 text-amber-500 fill-current" />
                        <span className="text-xs font-black text-amber-700">{pharma.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 bg-slate-50 rounded-full">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-black text-slate-600">{pharma.consultations} tư vấn</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                      <p className="text-sm font-bold text-slate-600">{pharma.specialty}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-slate-300" />
                      <p className="text-sm font-bold text-slate-400">{pharma.experience}</p>
                    </div>
                  </div>

                  <Button className="w-full h-14 rounded-2xl font-black" disabled={!pharma.available}>
                    Kết nối ngay
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">Gửi câu hỏi cho chúng tôi</h2>
                <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
                  Nếu bạn không cần tư vấn trực tiếp ngay lập tức, hãy để lại câu hỏi. Đội ngũ chuyên môn sẽ nghiên cứu và trả lời chi tiết qua Email/Zalo của bạn.
                </p>
                <div className="space-y-6">
                  {[
                    "Bảo mật thông tin cá nhân tuyệt đối",
                    "Được trả lời bởi dược sĩ có chuyên môn phù hợp",
                    "Kèm theo tài liệu hướng dẫn sử dụng thuốc chi tiết"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-bold text-slate-700">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="border-none shadow-2xl shadow-blue-900/10 rounded-[48px] overflow-hidden">
                <CardContent className="p-10 md:p-14">
                  <form className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Input placeholder="Họ và tên *" className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
                      <Input placeholder="Số điện thoại *" className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
                    </div>
                    <Input placeholder="Chủ đề bạn muốn tư vấn (VD: Thuốc dạ dày) *" className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
                    <Textarea placeholder="Mô tả chi tiết triệu chứng hoặc thắc mắc của bạn..." rows={5} className="rounded-[32px] bg-slate-50 border-none p-6 font-bold resize-none" />
                    <Button className="w-full h-16 rounded-[24px] font-black text-lg shadow-xl shadow-primary/20">
                      Gửi yêu cầu tư vấn <Send className="ml-2 w-5 h-5" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
