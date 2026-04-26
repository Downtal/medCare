"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PackageCheck, FileText, Send, CheckCircle, Wallet, AlertCircle, Phone, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export default function ReturnPolicyPage() {
  const sections = [
    { id: "dieu-kien", title: "1. Điều kiện đổi trả", icon: CheckCircle },
    { id: "tu-choi", title: "2. Trường hợp từ chối", icon: AlertCircle },
    { id: "quy-trinh", title: "3. Quy trình thực hiện", icon: Send },
    { id: "hoan-tien", title: "4. Phương thức hoàn tiền", icon: Wallet },
    { id: "chi-phi", title: "5. Chi phí vận chuyển", icon: PackageCheck },
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
                <PackageCheck className="w-4 h-4 mr-2" />
                Đảm bảo quyền lợi khách hàng
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                Chính sách <br /><span className="text-primary italic">Đổi trả & Hoàn tiền</span>
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
                  <p className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">Hướng dẫn</p>
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
                    "MedCare cam kết mang lại trải nghiệm mua sắm an tâm tuyệt đối. Nếu sản phẩm có bất kỳ lỗi nào từ nhà sản xuất hoặc quá trình vận chuyển, chúng tôi sẵn sàng đổi mới trong vòng 7 ngày."
                  </p>
                </div>

                {/* Section 1 */}
                <div id="dieu-kien" className="scroll-mt-32 space-y-8">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    1. Điều kiện đổi trả hàng
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      { title: "Lỗi nhà sản xuất", detail: "Sản phẩm bị hư hỏng, hết hạn hoặc không đúng mô tả kỹ thuật." },
                      { title: "Giao sai đơn hàng", detail: "Sản phẩm thực tế khác với đơn hàng bạn đã đặt trên hệ thống." },
                      { title: "Hư hỏng vận chuyển", detail: "Bao bì bị móp méo, vỡ hoặc rò rỉ khi vừa nhận hàng." },
                      { title: "Nguyên tem mác", detail: "Sản phẩm phải còn nguyên vẹn tem niêm phong và chưa qua sử dụng." }
                    ].map((item, i) => (
                      <div key={i} className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                        <h3 className="font-black text-slate-800 mb-2 text-lg">{item.title}</h3>
                        <p className="text-slate-500 leading-relaxed font-medium">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2 */}
                <div id="tu-choi" className="scroll-mt-32 space-y-8">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    2. Trường hợp không được đổi trả
                  </h2>
                  <div className="p-10 bg-slate-900 rounded-[40px] text-white">
                    <ul className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                      {[
                        "Thuốc kê đơn đã xuất kho (Theo quy định Bộ Y tế)",
                        "Sản phẩm đã bị mở niêm phong hoặc qua sử dụng",
                        "Sản phẩm hư hỏng do bảo quản sai cách từ phía khách",
                        "Quá thời hạn 7 ngày kể từ khi nhận hàng thành công",
                        "Quà tặng kèm theo chương trình khuyến mãi",
                        "Sản phẩm không có hóa đơn mua hàng tại MedCare"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-4 font-bold text-slate-300">
                           <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                           {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Section 3 */}
                <div id="quy-trinh" className="scroll-mt-32 space-y-8">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <Send className="w-6 h-6 text-blue-600" />
                    </div>
                    3. Quy trình thực hiện đổi trả
                  </h2>
                  <div className="relative space-y-12 before:absolute before:left-6 before:top-0 before:h-full before:w-1 before:bg-slate-100 before:hidden md:before:block">
                    {[
                      { step: "Bước 1", title: "Thông báo yêu cầu", detail: "Liên hệ Hotline 1900 1234 hoặc chụp ảnh sản phẩm gửi về support@medcare.vn." },
                      { step: "Bước 2", stepTitle: "Xác nhận & Thu hồi", detail: "Nhân viên MedCare sẽ xác nhận trong 24h và sắp xếp nhân viên vận chuyển đến lấy hàng tận nơi." },
                      { step: "Bước 3", stepTitle: "Kiểm tra chất lượng", detail: "Sản phẩm trả về được kiểm tra tại kho trung tâm để đảm bảo đủ điều kiện đổi trả." },
                      { step: "Bước 4", stepTitle: "Hoàn tất xử lý", detail: "Giao sản phẩm thay thế mới hoặc hoàn lại tiền theo yêu cầu của quý khách." }
                    ].map((item, i) => (
                      <div key={i} className="relative pl-0 md:pl-20">
                        <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-white border-4 border-slate-50 rounded-full items-center justify-center z-10 shadow-sm">
                           <div className="w-3 h-3 bg-primary rounded-full" />
                        </div>
                        <div className="p-8 bg-white rounded-[32px] border border-slate-100 group hover:border-primary transition-colors">
                          <span className="text-xs font-black text-primary uppercase tracking-widest mb-2 block">{item.step}</span>
                          <h4 className="text-xl font-black text-slate-900 mb-2">{item.stepTitle || item.title}</h4>
                          <p className="text-slate-500 font-medium leading-relaxed">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-12 bg-slate-100 rounded-[48px] border border-slate-200">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2">Cần hỗ trợ đổi trả gấp?</h3>
                      <p className="text-slate-600 font-medium italic">Chúng tôi xử lý mọi yêu cầu trong giờ hành chính từ 8:00 - 18:00.</p>
                    </div>
                    <Button size="lg" className="h-16 px-10 rounded-2xl font-black text-white shadow-xl shadow-primary/20 transition-transform hover:scale-105">
                      <Phone className="w-5 h-5 mr-3" /> Gọi ngay 1900 1234
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
