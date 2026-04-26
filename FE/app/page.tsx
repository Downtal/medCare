"use client"

import { useState, useEffect } from "react"
import { getApiBaseUrl } from "@/lib/config"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Pill,
  Stethoscope,
  Heart,
  Thermometer,
  Truck,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  User2
} from "lucide-react"
import type { Category, Product } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

const categoryIcons = {
  "Không kê đơn": Pill,
  "Kê đơn": Stethoscope,
  "Vitamin": Heart,
  "Thiết bị y tế": Thermometer,
};

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch(`${getApiBaseUrl()}/product-service/api/categories`),
          fetch(`${getApiBaseUrl()}/product-service/api/products`)
        ])

        if (catRes.ok) {
          const catData = await catRes.json()
          setCategories(catData)
        }

        if (prodRes.ok) {
          const prodData = await prodRes.json()
          const prods = Array.isArray(prodData) ? prodData : (prodData?.content || [])
          setFeaturedProducts(prods.slice(0, 8))
        }
      } catch (error) {
        console.error("Failed to fetch home data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const displayCategories = categories.length > 0 ? categories.slice(0, 4).map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: categoryIcons[c.name as keyof typeof categoryIcons] || Pill
  })) : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1">
        {/* Modern Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full -z-10">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] bg-accent/10 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl"
              >
                <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full bg-primary/10 text-primary border-none font-bold text-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Hệ thống nhà thuốc đạt chuẩn GPP
                </Badge>
                <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tight text-slate-900">
                  Chăm sóc sức khỏe <br />
                  <span className="text-primary italic">Toàn diện & Hiện đại</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
                  MedCare mang đến giải pháp y tế số hàng đầu Việt Nam. Kết nối bạn với dược sĩ chuyên môn chỉ trong 60 giây.
                </p>

                <div className="flex flex-wrap gap-4 mb-12">
                  <Button size="lg" className="rounded-2xl px-8 h-14 text-base font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95" asChild>
                    <Link href="/cua-hang">Mua sắm ngay <ArrowRight className="ml-2 w-5 h-5" /></Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-2xl px-8 h-14 text-base font-bold border-2 transition-all hover:bg-slate-50" asChild>
                    <Link href="/tu-van">Tư vấn Dược sĩ</Link>
                  </Button>
                </div>

                <div className="flex items-center gap-8 border-t border-slate-200 pt-8">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center relative overflow-hidden">
                        <User2 className="w-6 h-6 text-slate-400" />
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-primary flex items-center justify-center text-[10px] font-bold text-white">
                      +10k
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Tin dùng bởi hàng ngàn khách hàng</p>
                    <div className="flex text-yellow-400 mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Heart key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative hidden lg:block"
              >
                <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl shadow-blue-900/10 border-8 border-white">
                  <Image
                    src="/hero-banner.png"
                    alt="Medical Banner"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-6 -right-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-4 z-20"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Chứng nhận</p>
                    <p className="text-sm font-black text-slate-800">100% Chính hãng</p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
                  className="absolute -bottom-10 -left-10 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-4 z-20"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Vận chuyển</p>
                    <p className="text-sm font-black text-slate-800">Giao nhanh 2H</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Row */}
        <section className="bg-white border-y border-slate-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-50">
              {[
                { icon: Truck, title: "Giao hàng nhanh", desc: "Miễn phí từ 300k" },
                { icon: Clock, title: "Hỗ trợ 24/7", desc: "Dược sĩ trực tuyến" },
                { icon: ShieldCheck, title: "An toàn tuyệt đối", desc: "Chuẩn GPP quốc tế" },
                { icon: Heart, title: "Khách hàng thân thiết", desc: "Đặt trọn niềm tin" }
              ].map((feature, i) => (
                <div key={i} className="p-8 flex items-center gap-4 group cursor-default">
                  <feature.icon className="w-10 h-10 text-primary transition-transform group-hover:scale-110" />
                  <div>
                    <h3 className="font-bold text-slate-900 leading-none mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-500 font-medium">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Featured Products */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6 text-center md:text-left">
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900">Sản phẩm nổi bật</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-full px-8 h-12 border-2 font-bold" asChild>
                  <Link href="/cua-hang">Khám phá bộ sưu tập</Link>
                </Button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-[4/5] bg-slate-50 animate-pulse rounded-[32px]" />
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10"
                >
                  {featuredProducts.map((product) => (
                    <motion.div key={product.id} variants={itemVariants}>
                      <ProductCard
                        id={product.id.toString()}
                        slug={product.slug}
                        name={product.name}
                        ingredient={product.activeIngredients || ""}
                        price={product.price}
                        rating={4.8}
                        image={product.primaryImageUrl || "/placeholder.svg"}
                        requiresPrescription={product.requiresPrescription}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Professional Consultation Section */}
        <section className="py-24 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent)]" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto bg-primary rounded-[48px] p-10 md:p-20 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent skew-x-12 translate-x-1/2 group-hover:translate-x-1/4 transition-transform duration-1000" />

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="text-white">
                  <div className="w-16 h-1 bg-white/30 mb-8 rounded-full" />
                  <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                    Cần tư vấn trực tiếp <br />với Dược sĩ?
                  </h2>
                  <p className="text-lg md:text-xl mb-10 text-white/80 leading-relaxed font-medium">
                    Đội ngũ dược sĩ MedCare luôn sẵn sàng hỗ trợ bạn 24/7. Chúng tôi giúp bạn chọn đúng thuốc, đúng liều lượng và đúng cách dùng.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button size="lg" variant="secondary" className="rounded-2xl h-14 px-8 font-black text-primary shadow-xl shadow-black/10 transition-transform hover:scale-105 active:scale-95" asChild>
                      <Link href="/tu-van">Kết nối ngay</Link>
                    </Button>
                    <div className="flex items-center gap-3 ml-2">
                      <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center animate-pulse">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-bold text-white uppercase tracking-widest">Trung bình 60s</p>
                    </div>
                  </div>
                </div>

                <div className="relative hidden md:block">
                  <div className="relative aspect-square max-w-[400px] mx-auto">
                    <div className="absolute inset-0 bg-white/10 rounded-full blur-[60px]" />
                    <Image
                      src="/pharmacist-consult.png"
                      alt="Consultation"
                      fill
                      className="object-contain drop-shadow-2xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Medical Warning Footer */}
        <section className="py-10 bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-center">
              <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                <Thermometer className="w-6 h-6" />
              </div>
              <p className="text-sm md:text-base text-slate-500 font-medium text-center md:text-left leading-relaxed">
                <strong>Lưu ý y tế quan trọng:</strong> Tất cả thông tin trên MedCare chỉ mang tính chất tham khảo. Không được tự ý áp dụng mà không có chỉ định của chuyên gia y tế. Hãy gọi 115 trong trường hợp khẩn cấp.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
