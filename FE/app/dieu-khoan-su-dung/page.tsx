"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Scale, UserCircle, ShoppingBag, Pill, Truck, ShieldAlert, Gavel, Mail, ArrowRight, Info } from "lucide-react"
import { motion } from "framer-motion"

export default function TermsPage() {
  const sections = [
    { id: "gioi-thieu", title: "1. Giới thiệu chung", icon: Info },
    { id: "tai-khoan", title: "2. Tài khoản người dùng", icon: UserCircle },
    { id: "dat-hang", title: "3. Đặt hàng & Thanh toán", icon: ShoppingBag },
    { id: "thuoc-ke-don", title: "4. Quy định Thuốc kê đơn", icon: Pill },
    { id: "giao-hang", title: "5. Chính sách Giao nhận", icon: Truck },
    { id: "trach-nhiem", title: "6. Giới hạn trách nhiệm", icon: ShieldAlert },
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
                <Gavel className="w-4 h-4 mr-2" />
                Thỏa thuận sử dụng dịch vụ
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                Điều khoản <br /><span className="text-primary italic">Sử dụng Dịch vụ</span>
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
                  <p className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">Điều khoản</p>
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
                    "Bằng việc truy cập hoặc sử dụng bất kỳ dịch vụ nào của MedCare, bạn đồng ý chịu sự ràng buộc bởi các điều khoản và điều kiện được nêu dưới đây. Đây là một thỏa thuận pháp lý giữa bạn và MedCare."
                  </p>
                </div>

                {/* Section 1 */}
                <div id="gioi-thieu" className="scroll-mt-32 space-y-8">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <Scale className="w-6 h-6 text-blue-600" />
                    </div>
                    1. Giới thiệu chung
                  </h2>
                  <p className="text-lg text-slate-600 leading-relaxed font-medium">
                    MedCare là nền tảng thương mại điện tử chuyên biệt về dược phẩm và thiết bị y tế. Chúng tôi kết nối người dùng với các nhà thuốc đạt chuẩn GPP và đội ngũ dược sĩ chuyên môn cao.
                  </p>
                </div>

                {/* Section 2 */}
                <div id="tai-khoan" className="scroll-mt-32 space-y-8">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    2. Tài khoản người dùng
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                      <h3 className="font-black text-slate-800 mb-2">Đăng ký tài khoản</h3>
                      <p className="text-slate-500 font-medium">Người dùng cần cung cấp thông tin chính xác và chịu trách nhiệm về tính bảo mật của mật khẩu cá nhân.</p>
                    </div>
                    <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                      <h3 className="font-black text-slate-800 mb-2">Độ tuổi sử dụng</h3>
                      <p className="text-slate-500 font-medium">Bạn phải đủ 18 tuổi để thực hiện các giao dịch mua thuốc kê đơn trên hệ thống.</p>
                    </div>
                  </div>
                </div>

                {/* Section 4: Prescriptions */}
                <div id="thuoc-ke-don" className="scroll-mt-32 space-y-8">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                      <Pill className="w-6 h-6 text-red-600" />
                    </div>
                    4. Quy định về Thuốc kê đơn
                  </h2>
                  <div className="p-10 bg-slate-900 rounded-[40px] text-white">
                    <p className="text-lg mb-6 font-bold text-primary">Lưu ý đặc biệt quan trọng:</p>
                    <ul className="space-y-4">
                      {[
                        "Phải có toa thuốc hợp lệ từ bác sĩ được cấp phép hành nghề.",
                        "Dược sĩ MedCare sẽ gọi điện xác nhận toa thuốc trước khi đơn hàng được gửi đi.",
                        "Chúng tôi có quyền từ chối cung cấp nếu toa thuốc có dấu hiệu bị tẩy xóa hoặc không rõ ràng.",
                        "Khách hàng cam kết sử dụng thuốc đúng liều lượng và chỉ dẫn của bác sĩ chuyên khoa."
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-4 font-bold text-slate-300">
                           <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
                           {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Section 6: Liability */}
                <div id="trach-nhiem" className="scroll-mt-32 space-y-8">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <ShieldAlert className="w-6 h-6 text-slate-600" />
                    </div>
                    6. Giới hạn trách nhiệm
                  </h2>
                  <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed space-y-4">
                    <p>
                      Mọi thông tin về sức khỏe và thuốc trên website chỉ mang tính chất tham khảo. MedCare không chịu trách nhiệm về bất kỳ thiệt hại nào phát sinh từ việc người dùng tự ý chẩn đoán hoặc sử dụng thuốc sai chỉ định của bác sĩ.
                    </p>
                    <p>
                      Chúng tôi cam kết nỗ lực tối đa để đảm bảo hệ thống vận chuyển và thanh toán hoạt động ổn định, nhưng không chịu trách nhiệm cho các lỗi phát sinh từ bên thứ ba (ngân hàng, nhà mạng, thiên tai).
                    </p>
                  </div>
                </div>

                {/* Contact Footer */}
                <div className="p-12 bg-slate-100 rounded-[48px] border border-slate-200">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2">Cần làm rõ điều khoản?</h3>
                      <p className="text-slate-600 font-medium">Gửi phản hồi cho chúng tôi nếu bạn có bất kỳ thắc mắc nào.</p>
                    </div>
                    <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl font-black border-2 transition-all hover:bg-slate-200">
                      <Mail className="w-5 h-5 mr-3" /> Gửi phản hồi
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

function Info(props: any) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}
