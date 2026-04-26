"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Eye, Share2, Info, UserCheck, RefreshCw, Mail, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export default function PrivacyPolicyPage() {
  const sections = [
    { id: "thu-thap", title: "1. Thông tin thu thập", icon: Info },
    { id: "su-dung", title: "2. Mục đích sử dụng", icon: Eye },
    { id: "bao-mat", title: "3. Bảo mật dữ liệu", icon: Lock },
    { id: "chia-se", title: "4. Chia sẻ thông tin", icon: Share2 },
    { id: "quyen-loi", title: "5. Quyền của bạn", icon: UserCheck },
    { id: "thay-doi", title: "6. Thay đổi chính sách", icon: RefreshCw },
  ]

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1">
        {/* Banner Section */}
        <section className="bg-slate-900 py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl"
            >
              <Badge className="mb-6 bg-primary/20 text-primary border-none font-bold px-4 py-1.5 rounded-full">
                <Shield className="w-4 h-4 mr-2" />
                Dữ liệu của bạn được bảo mật tuyệt đối
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                Chính sách <br /><span className="text-primary italic">Bảo mật thông tin</span>
              </h1>
              <p className="text-slate-400 text-lg font-medium">Cập nhật lần cuối: 24/04/2026</p>
            </motion.div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-4 gap-12">
              
              {/* Sidebar Navigation */}
              <aside className="hidden lg:block lg:col-span-1 sticky top-32 h-fit">
                <div className="space-y-1 p-2 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5">
                  <p className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">Mục lục</p>
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollTo(s.id)}
                      className="w-full flex items-center gap-3 px-6 py-4 text-left font-bold text-slate-600 hover:text-primary hover:bg-slate-50 rounded-2xl transition-all group"
                    >
                      <s.icon className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                      {s.title}
                    </button>
                  ))}
                </div>
              </aside>

              {/* Content Area */}
              <div className="lg:col-span-3 space-y-16">
                
                {/* Introduction */}
                <div className="prose prose-slate max-w-none">
                  <p className="text-xl text-slate-600 leading-relaxed italic border-l-4 border-primary pl-8 py-2">
                    "Tại MedCare, chúng tôi coi trọng sự riêng tư của bạn hơn bất cứ điều gì. Chính sách này mô tả cách chúng tôi bảo vệ thông tin sức khỏe và cá nhân của bạn trong kỷ nguyên số."
                  </p>
                </div>

                {/* Section 1 */}
                <div id="thu-thap" className="scroll-mt-32 space-y-8">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <Info className="w-6 h-6 text-blue-600" />
                    </div>
                    1. Thông tin chúng tôi thu thập
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                      <h3 className="font-black text-slate-800 mb-4 text-lg">Thông tin cá nhân</h3>
                      <p className="text-slate-500 leading-relaxed font-medium">Họ tên, số điện thoại, email, địa chỉ giao hàng và thông tin định danh cần thiết để xử lý đơn hàng.</p>
                    </div>
                    <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                      <h3 className="font-black text-slate-800 mb-4 text-lg">Dữ liệu Y tế</h3>
                      <p className="text-slate-500 leading-relaxed font-medium">Toa thuốc điện tử, lịch sử tư vấn và các thông tin sức khỏe đặc biệt bạn cung cấp cho dược sĩ.</p>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div id="su-dung" className="scroll-mt-32 space-y-8">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                      <Eye className="w-6 h-6 text-green-600" />
                    </div>
                    2. Mục đích sử dụng thông tin
                  </h2>
                  <div className="p-10 bg-slate-900 rounded-[40px] text-white">
                    <ul className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                      {[
                        "Xác thực toa thuốc và tư vấn chuyên môn",
                        "Xử lý và vận chuyển đơn hàng nhanh 2H",
                        "Cá nhân hóa trải nghiệm mua sắm",
                        "Gửi thông báo ưu đãi và chăm sóc sức khỏe",
                        "Phát hiện và ngăn chặn các hành vi gian lận",
                        "Tuân thủ các quy định pháp luật về dược phẩm"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-4 font-bold text-slate-300">
                           <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                           {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Section 3 */}
                <div id="bao-mat" className="scroll-mt-32 space-y-8">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                      <Lock className="w-6 h-6 text-purple-600" />
                    </div>
                    3. Bảo mật dữ liệu y tế
                  </h2>
                  <p className="text-lg text-slate-600 leading-relaxed font-medium">
                    Chúng tôi áp dụng các tiêu chuẩn bảo mật khắt khe nhất trong ngành y tế để bảo vệ dữ liệu của bạn:
                  </p>
                  <div className="space-y-4">
                    {[
                      { title: "Mã hóa 256-bit SSL", detail: "Toàn bộ dữ liệu truyền tải giữa thiết bị của bạn và máy chủ được mã hóa tuyệt đối." },
                      { title: "Lưu trữ phi tập trung", detail: "Thông tin cá nhân và dữ liệu y tế được lưu trữ tách biệt để đảm bảo an toàn tối đa." },
                      { title: "Kiểm soát truy cập nghiêm ngặt", detail: "Chỉ dược sĩ trực tiếp phụ trách đơn hàng mới có quyền xem thông tin y tế của bạn." }
                    ].map((item, i) => (
                      <div key={i} className="p-8 bg-white rounded-[32px] border border-slate-100 flex items-center justify-between group hover:border-primary transition-colors">
                        <div>
                          <h4 className="font-black text-slate-900 mb-1">{item.title}</h4>
                          <p className="text-slate-500 font-medium">{item.detail}</p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Footer */}
                <div className="p-12 bg-primary rounded-[48px] text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <h3 className="text-3xl font-black mb-4">Bạn có thắc mắc về quyền riêng tư?</h3>
                      <p className="text-lg text-white/80 font-medium">Bộ phận bảo mật dữ liệu của chúng tôi luôn sẵn lòng giải đáp.</p>
                    </div>
                    <Button size="lg" variant="secondary" className="h-16 px-10 rounded-2xl font-black text-primary shadow-xl shadow-black/10 transition-transform hover:scale-105 active:scale-95">
                      <Mail className="w-5 h-5 mr-3" /> Liên hệ Bảo mật
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
