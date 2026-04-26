"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, HelpCircle, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1">
        {/* Header Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full -z-10 bg-slate-900" />
          <div className="absolute top-0 right-0 w-1/2 h-full -z-10 bg-gradient-to-l from-primary/20 to-transparent" />
          
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">Liên hệ với chúng tôi</h1>
              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                Đội ngũ dược sĩ và chăm sóc khách hàng của MedCare luôn sẵn sàng hỗ trợ bạn 24/7. Hãy kết nối với chúng tôi ngay hôm nay.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-20 -mt-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-5 gap-8 items-start">
              
              {/* Contact Information & FAQ */}
              <div className="lg:col-span-2 space-y-8">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <Card className="border-none shadow-2xl shadow-blue-900/5 rounded-[40px] overflow-hidden">
                    <CardContent className="p-10 space-y-10">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                          <MessageSquare className="text-primary w-6 h-6" />
                          Thông tin liên hệ
                        </h2>
                        
                        <div className="space-y-8">
                          {[
                            { icon: MapPin, title: "Địa chỉ trụ sở", detail: "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh", color: "blue" },
                            { icon: Phone, title: "Đường dây nóng", detail: "1900 1234 - (028) 3912 8888", color: "green" },
                            { icon: Mail, title: "Hòm thư điện tử", detail: "support@medcare.vn", color: "purple" },
                            { icon: Clock, title: "Giờ làm việc", detail: "8:00 - 21:00 (Thứ 2 - Chủ Nhật)", color: "amber" }
                          ].map((item, i) => (
                            <div key={i} className="flex gap-6 group">
                              <div className={`h-14 w-14 rounded-2xl bg-${item.color}-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{item.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="p-10 bg-slate-900 rounded-[40px] text-white">
                    <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                      <HelpCircle className="text-primary w-6 h-6" />
                      FAQ Nhanh
                    </h2>
                    <div className="space-y-4">
                      {[
                        "Làm sao để mua thuốc kê đơn?",
                        "Thời gian giao hàng là bao lâu?",
                        "Chính sách đổi trả như thế nào?"
                      ].map((q, i) => (
                        <button key={i} className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors text-left group">
                          <span className="font-bold text-slate-300 group-hover:text-white transition-colors">{q}</span>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Contact Form */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="lg:col-span-3"
              >
                <Card className="border-none shadow-2xl shadow-blue-900/10 rounded-[40px] overflow-hidden">
                  <CardContent className="p-10 md:p-14">
                    <div className="mb-10">
                      <h2 className="text-3xl font-black text-slate-900 mb-4">Gửi tin nhắn</h2>
                      <p className="text-slate-500 font-medium">Bạn có thắc mắc? Đừng ngần ngại đặt câu hỏi, chúng tôi sẽ phản hồi trong vòng 30 phút.</p>
                    </div>
                    
                    <form className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label htmlFor="name" className="text-slate-900 font-black text-sm uppercase tracking-wider">Họ và tên</Label>
                          <Input id="name" placeholder="VD: Nguyễn Văn A" className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-base px-6" />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="phone" className="text-slate-900 font-black text-sm uppercase tracking-wider">Số điện thoại</Label>
                          <Input id="phone" type="tel" placeholder="VD: 0912 345 678" className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-base px-6" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="email" className="text-slate-900 font-black text-sm uppercase tracking-wider">Email liên hệ</Label>
                        <Input id="email" type="email" placeholder="VD: example@email.com" className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-base px-6" />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="message" className="text-slate-900 font-black text-sm uppercase tracking-wider">Nội dung thắc mắc</Label>
                        <Textarea id="message" placeholder="Hãy mô tả vấn đề bạn cần tư vấn..." rows={6} className="rounded-[24px] border-2 border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-base p-6 resize-none" />
                      </div>

                      <Button type="submit" className="w-full h-16 rounded-[24px] bg-primary hover:bg-primary/90 font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                        Gửi tin nhắn tư vấn <Send className="ml-2 w-5 h-5" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-6 mb-12">
              <div className="h-14 w-14 rounded-[20px] bg-primary/10 flex items-center justify-center">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hệ thống nhà thuốc</h2>
            </div>
            <div className="aspect-[21/9] w-full rounded-[48px] overflow-hidden border-8 border-slate-50 bg-slate-100 relative group cursor-pointer">
              <div className="absolute inset-0 flex items-center justify-center bg-slate-200/50 group-hover:bg-slate-200/20 transition-colors">
                 <div className="bg-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 border border-slate-100">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                    <span className="font-black text-slate-800">Cửa hàng trung tâm - 123 Nguyễn Huệ</span>
                 </div>
              </div>
              <Image 
                src="https://res.cloudinary.com/dvp5v8scf/image/upload/v1740051834/medcare/map-mockup.png" 
                alt="Map" 
                fill 
                className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
