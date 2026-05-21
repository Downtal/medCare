"use client"

import Link from "next/link"
import Image from "next/image"
import { Search, ShoppingCart, Phone, User, Menu, Mic, Camera, Scan, Maximize, X, Loader2, Info, ChevronDown, Lock, LogOut, Pill, Image as ImageIcon, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useCartAnimationStore } from "@/lib/store/useCartAnimationStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getApiBaseUrl } from "@/lib/config"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useCartStore } from "@/lib/store/useCartStore"
import { SearchOverlay } from "./search-overlay"
import { NotificationBell } from "./notification-bell"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { logoutUser } from "@/lib/logout"
import { toast } from "sonner"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import Tesseract from "tesseract.js"
import { useChatStore } from "@/lib/store/useChatStore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { productService } from "@/services/productService"

// Featured Products Component (Simplified: uses data passed from parent)
function FeaturedProducts({ products }: { products: any[] }) {
  if (!products || products.length === 0) return <div className="text-sm italic text-muted-foreground">Đang cập nhật...</div>

  return (
    <div className="grid grid-cols-2 gap-6">
      {products.map((prod: any) => (
        <Link
          key={prod.id}
          href={`/san-pham/${prod.slug}`}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary/5 transition-colors group/p"
        >
          <div className="relative h-14 w-14 bg-white border rounded-lg overflow-hidden shrink-0 group-hover/p:scale-105 transition-transform">
            <Image
              src={prod.primaryImageUrl || "/placeholder.svg"}
              alt={prod.name}
              fill
              sizes="60px"
              quality={75}
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-[13px] font-bold text-slate-800 line-clamp-1 group-hover/p:text-primary transition-colors">{prod.name}</h4>
            <span className="text-[13px] font-black text-primary">{prod.price?.toLocaleString("vi-VN")}đ</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

export function Header() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const cartItems = useCartStore((state) => state.items)
  const cartCount = cartItems.length
  const { data: session, status, update } = useSession()
  const [fullNameFromApi, setFullNameFromApi] = useState<string | null>(null)
  const displayName = fullNameFromApi || session?.user?.fullName || session?.user?.name || session?.user?.username || null
  const [isListening, setIsListening] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searchResultsMap, setSearchResultsMap] = useState<Record<string, any[]>>({})
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)
  const [voiceQuery, setVoiceQuery] = useState("")
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loadingNav, setLoadingNav] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const voiceQueryRef = useRef("")
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const cartIconRef = useRef<HTMLAnchorElement>(null)
  const { animations, removeAnimation } = useCartAnimationStore()

  const hasAutoUpdated = useRef(false);

  useEffect(() => {
    // 1. Fetch Category Tree once on mount
    if (categories.length === 0) {
      const fetchTree = async () => {
        try {
          const ctrl = new AbortController()
          const tid = setTimeout(() => ctrl.abort(), 3000)
          const res = await fetch(`${getApiBaseUrl()}/product-service/api/categories/tree`, {
            cache: 'no-store',
            signal: ctrl.signal,
          })
          clearTimeout(tid)
          if (res.ok) {
            const data = await res.json()
            setCategories(Array.isArray(data) ? data : [])
          }
        } catch (err) {
          // Backend offline — silently continue with empty menu
        } finally {
          setLoadingNav(false)
        }
      }
      fetchTree()
    }

    // 2. Sync Cart and Profile Name
    const syncCartAndProfile = async () => {
      if (status === "loading") return;

      const currentCartStore = useCartStore.getState();
      const accessToken = session?.user?.accessToken;

      if (status === "authenticated" && accessToken) {
        // Only auto-update once per session to avoid infinite loops
        if (!session?.user?.fullName && !fullNameFromApi && !hasAutoUpdated.current) {
          hasAutoUpdated.current = true;
          try {
            const ctrl = new AbortController()
            const tid = setTimeout(() => ctrl.abort(), 3000)
            const profileRes = await fetch(`${getApiBaseUrl()}/user-service/api/users/profiles/me`, {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              signal: ctrl.signal,
            });
            clearTimeout(tid)
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              if (profileData.fullName) {
                setFullNameFromApi(profileData.fullName);
                update({
                  user: { ...session?.user, fullName: profileData.fullName, name: profileData.fullName }
                });
              }
            }
          } catch (pErr) {
            // Silently fail — backend offline or timeout
          }
        }
        await currentCartStore.mergeCart(accessToken);
      } else if (status === "unauthenticated") {
        await currentCartStore.initializeCart();
      }
    }

    syncCartAndProfile();

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOverlayOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [session, status])

  useEffect(() => {
    // Immediate logout if session error occurs 
    if ((session as any)?.error === "RefreshAccessTokenError") {
      toast.error("Phiên đăng nhập đã hết hạn hoặc tài khoản đã bị khóa bởi quản trị viên.");
      logoutUser(session?.user?.accessToken);
    }
  }, [session])

  const handleSearch = (e?: React.FormEvent, queryOverride?: string) => {
    if (e) e.preventDefault()
    const query = queryOverride || searchQuery
    if (query.trim()) {
      const history = JSON.parse(localStorage.getItem("search_history") || "[]")
      localStorage.setItem("search_history", JSON.stringify([query.trim(), ...history.filter((h: any) => h !== query.trim())].slice(0, 10)))
      router.push(`/cua-hang?q=${encodeURIComponent(query.trim())}`)
      setSearchOverlayOpen(false)
      setSearchQuery(query.trim())
    }
  }

  const { openChat } = useChatStore()
  const [ocrProgress, setOcrProgress] = useState(0)

  const handleScanPrescription = async () => {
    if (!selectedImage) return;
    
    setIsScanning(true);
    setOcrProgress(0);
    
    try {
      const result = await Tesseract.recognize(
        selectedImage,
        'vie+eng', // Scan both Vietnamese and English
        { 
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.floor(m.progress * 100));
            }
          }
        }
      );
      
      if (result.data.text.trim().length < 5) {
        toast.error("Không thể nhận diện được nội dung trong ảnh. Vui lòng chụp rõ hơn.");
      } else {
        // Extract potential medicine names (lines with text, excluding noise)
        const noiseWords = /BỆNH VIỆN|PHÒNG KHÁM|ĐỊA CHỈ|NGÀY|BS|BÁC SĨ|TUỔI|NAM|NỮ|CHẨN ĐOÁN|SỐ LƯỢNG|SỐ LƯƠNG|LIỀU DÙNG|CÁCH DÙNG|UỐNG|LẦN|SAU ĂN|TRƯỚC ĂN|TỐI|SÁNG|TRƯA|CHIỀU|MỖI/i;
        
        const lines = result.data.text.split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 3 && !noiseWords.test(l));
        
        // Take unique items
        const uniqueResults = Array.from(new Set(lines));
        
        if (uniqueResults.length === 0) {
          toast.error("Không tìm thấy tên thuốc khả thi. Vui lòng thử lại.");
        } else {
          // Pass the text via sessionStorage for a cleaner URL
          sessionStorage.setItem("pending_ocr_text", result.data.text);
          setImageModalOpen(false);
          router.push(`/tim-kiem-don-thuoc`);
        }
      }
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Lỗi trong quá trình quét ảnh. Vui lòng thử lại.");
    } finally {
      setIsScanning(false);
      setOcrProgress(0);
    }
  }


  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      toast.error("Trình duyệt của bạn không hỗ trợ tìm kiếm bằng giọng nói. Vui lòng sử dụng Chrome.")
      return
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    const rec = new SpeechRecognition()
    recognitionRef.current = rec
    rec.lang = 'vi-VN'
    rec.interimResults = true
    rec.continuous = false

    rec.onstart = () => { 
      setIsListening(true)
      setVoiceQuery("") 
      voiceQueryRef.current = ""
    }

    rec.onresult = (e: any) => { 
      let transcript = e.results[0][0].transcript
      // Remove trailing period if exists
      if (transcript.endsWith('.')) {
        transcript = transcript.slice(0, -1)
      }
      voiceQueryRef.current = transcript
      setVoiceQuery(transcript)
      setSearchQuery(transcript)
    }

    rec.onerror = (e: any) => {
      console.error("Speech Recognition Error:", e.error)
      setIsListening(false)
      if (e.error === 'not-allowed') {
        toast.error("Vui lòng cấp quyền truy cập Micro để sử dụng tính năng này.")
      } else if (e.error === 'no-speech') {
        toast.error("Không nhận dạng được âm thanh. Vui lòng thử lại.")
      } else {
        toast.error("Lỗi khi kết nối giọng nói. Vui lòng thử lại.")
      }
    }

    rec.onend = () => { 
      setIsListening(false)
      // Do NOT trigger search automatically anymore
    }

    try {
      rec.start()
    } catch (err) {
      console.error("Start recording failed:", err)
      setIsListening(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Disclaimer Top Bar */}
        <div className="bg-amber-50/80 border-b border-amber-100 py-1 text-center hidden sm:block">
          <p className="text-[10px] md:text-[11px] font-bold text-amber-800 tracking-wide">
            Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ.
          </p>
        </div>
        {/* Top Bar */}
        <div className="bg-primary text-primary-foreground shadow-sm">
          <div className="container mx-auto flex items-center justify-between px-4 py-2 text-[11px] sm:text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-medium">
                <Phone className="h-3.5 w-3.5" />
                <span>Hotline: 1900 1234 (Miễn phí)</span>
              </div>
            </div>
            <span className="hidden md:inline font-semibold uppercase tracking-tighter">Miễn phí vận chuyển cho đơn hàng từ 300.000đ</span>
            <div className="flex items-center gap-4 font-medium">
              <Link href="/he-thong" className="hover:text-white/80 transition-opacity">Hệ thống nhà thuốc</Link>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between gap-4 lg:gap-12">
            <Link href="/" className="flex items-center gap-3 shrink-0 hover:opacity-90 transition-opacity">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                <Pill className="h-7 w-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-primary leading-none uppercase">MedCare</span>
                <span className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] mt-1 uppercase">Health & Pharma</span>
              </div>
            </Link>

            <div className="flex-1 max-w-2xl relative" ref={searchContainerRef}>
              <form onSubmit={handleSearch} className="group relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchOverlayOpen(true)} placeholder="Tìm tên thuốc, triệu chứng, thương hiệu..." className="pl-12 pr-28 h-12 rounded-2xl border-2 border-muted focus-visible:border-primary transition-all bg-muted/30 font-medium text-sm lg:text-base outline-none !ring-0" />
                <div className="absolute right-3 hidden sm:flex items-center gap-1.5">
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => { setVoiceModalOpen(true); setVoiceQuery(""); voiceQueryRef.current = "" }}><Mic className="h-5 w-5" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => { setImageModalOpen(true); setSelectedImage(null); setIsScanning(false) }}><Scan className="h-5 w-5" /></Button>
                </div>
              </form>
              <SearchOverlay query={searchQuery} isOpen={searchOverlayOpen} onClose={() => setSearchOverlayOpen(false)} onSelectKeyword={(kw) => handleSearch(undefined, kw)} />
            </div>

            <div className="flex items-center gap-1 sm:gap-4 shrink-0">
              {displayName ? (
                <Button
                  variant="ghost"
                  className="hidden sm:flex items-center gap-3 px-4 rounded-2xl hover:bg-primary/5 transition-all group border border-transparent hover:border-primary/10"
                  asChild
                >
                  <Link href="/tai-khoan/ho-so">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <User className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col items-start leading-none text-left">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wider">Tài khoản</span>
                      <span className="max-w-[150px] lg:max-w-[180px] truncate font-bold text-sm text-foreground">{displayName}</span>
                    </div>
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="hidden sm:flex rounded-2xl px-6 font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" asChild>
                  <Link href="/dang-nhap">Đăng nhập</Link>
                </Button>
              )}

              {/* Notification button removed */}

              <Link
                ref={cartIconRef}
                href="/gio-hang"
                className="relative rounded-2xl h-12 w-12 flex items-center justify-center hover:bg-primary/5 transition-all group"
                id="cart-icon"
              >
                <ShoppingCart className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                {cartCount > 0 && (
                  <Badge className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full p-0 text-[10px] bg-primary text-primary-foreground border-2 border-background flex items-center justify-center shadow-md animate-in zoom-in duration-300">
                    {cartCount}
                  </Badge>
                )}
              </Link>

              <Button variant="ghost" size="icon" className="md:hidden rounded-xl h-10 w-10 text-primary"><Menu className="h-6 w-6" /></Button>
            </div>
          </div>
        </div>

        {/* Dynamic Mega Menu with Radix UI */}
        <nav className="border-t border-border bg-white shadow-sm overflow-visible h-14">
          <div className="container mx-auto px-4 h-full flex items-center">
            {loadingNav ? (
              <div className="flex items-center gap-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-4 w-24 bg-muted animate-pulse rounded-full" />
                ))}
              </div>
            ) : (
              <NavigationMenu className="max-w-full justify-start h-14" delayDuration={0}>
                <NavigationMenuList className="gap-2">
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "h-14 font-semibold text-[14px] text-slate-700 cursor-pointer")}>
                      <Link href="/cua-hang">
                        Cửa hàng
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  {categories.map((cat) => (
                    <NavigationMenuItem key={cat.id}>
                      {cat.children && cat.children.length > 0 ? (
                        <>
                          <NavigationMenuTrigger className={cn(navigationMenuTriggerStyle(), "h-14 font-semibold text-[14px] text-slate-700 bg-transparent hover:bg-primary/5 hover:text-primary border-none")}>
                            {cat.name}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent className="absolute top-0 left-0 w-auto">
                            <div className="w-[85vw] lg:w-[950px] p-6 flex gap-10 bg-white border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                              {/* Left: Sub Categories */}
                              <div className="w-1/3">
                                <div className="grid grid-cols-1 gap-3">
                                  {cat.children.map((sub: any) => (
                                    <Link
                                      key={sub.id}
                                      href={`/cua-hang?category=${sub.slug}`}
                                      className="text-[14px] font-bold text-slate-800 hover:text-primary hover:translate-x-1 transition-all w-fit py-1"
                                    >
                                      {sub.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                              {/* Right: Featured Products */}
                              <div className="w-2/3 border-l border-muted/50 pl-10">
                                <div className="flex items-center justify-between mb-6">
                                  <Link href={`/cua-hang?category=${cat.slug}`} className="text-[11px] font-black text-primary hover:underline uppercase tracking-wide">Xem tất cả</Link>
                                </div>
                                <FeaturedProducts products={cat.recentProducts} />
                              </div>
                            </div>
                          </NavigationMenuContent>
                        </>
                      ) : (
                        <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "h-14 font-semibold text-[14px] text-slate-700 cursor-pointer")}>
                          <Link href={`/cua-hang?category=${cat.slug}`}>
                            {cat.name}
                          </Link>
                        </NavigationMenuLink>
                      )}
                    </NavigationMenuItem>
                  ))}

                  {/* Special Items */}
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "h-14 font-semibold text-[14px] text-slate-700 cursor-pointer")}>
                      <Link href="/khuyen-mai">
                        Khuyến mãi
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "h-14 font-semibold text-[14px] text-slate-700 cursor-pointer")}>
                      <Link href="/tu-van">
                        Tư vấn sức khỏe
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>
        </nav>
      </header>

      {/* Flying Cart Animation Overlay */}
      <AnimatePresence>
        {animations.map((anim) => (
          <motion.div
            key={anim.id}
            initial={{
              x: anim.startX,
              y: anim.startY,
              scale: 1,
              opacity: 1,
              position: 'fixed',
              zIndex: 9999,
              pointerEvents: 'none'
            }}
            animate={{
              x: cartIconRef.current ? cartIconRef.current.getBoundingClientRect().left + cartIconRef.current.getBoundingClientRect().width / 2 - 25 : 0,
              y: cartIconRef.current ? cartIconRef.current.getBoundingClientRect().top + cartIconRef.current.getBoundingClientRect().height / 2 - 25 : 0,
              scale: 0.1,
              opacity: 0.5,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.0, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={() => {
              removeAnimation(anim.id);
              // Trigger a small bump on the cart icon
              if (cartIconRef.current) {
                cartIconRef.current.classList.add('animate-bounce-short');
                setTimeout(() => cartIconRef.current?.classList.remove('animate-bounce-short'), 500);
              }
            }}
          >
            <div className="w-[50px] h-[50px] rounded-full overflow-hidden border-2 border-primary bg-white shadow-xl flex items-center justify-center">
              <Image
                src={anim.imageUrl || "/placeholder.svg"}
                alt="flying-item"
                width={50}
                height={50}
                quality={50}
                className="object-contain"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Image Search Modal */}
      <Dialog open={imageModalOpen} onOpenChange={(open) => { 
        setImageModalOpen(open); 
        if (!open) {
          setIsScanning(false);
          setShowResults(false);
          setScanResults([]);
          setSearchResultsMap({});
          setIsSearchingProducts(false);
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl">
          <DialogTitle className="sr-only">Tìm kiếm bằng hình ảnh</DialogTitle>
          <div className="bg-gradient-to-br from-indigo-600 via-primary to-blue-700 p-6 text-white relative overflow-hidden text-center">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300 rounded-full blur-3xl"></div>
             </div>
             <div className="relative z-10">
               <div className="mx-auto w-12 h-12 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl flex items-center justify-center mb-3 shadow-xl">
                 <Scan className="h-6 w-6 text-white" />
               </div>
               <h2 className="text-xl font-black mb-1 uppercase tracking-tight">Scan Toa Thuốc</h2>
               <p className="text-white/80 text-xs font-medium">Tải ảnh đơn thuốc hoặc vỏ thuốc để MedCare tư vấn</p>
             </div>
          </div>
          
          <div className="p-6 bg-white">
            {!selectedImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                  <Upload className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800 text-sm">Tải lên từ thiết bị</p>
                  <p className="text-[10px] text-slate-500 mt-1 whitespace-nowrap">Hỗ trợ JPG, PNG (Tối đa 5MB)</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (re) => setSelectedImage(re.target?.result as string)
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {!showResults ? (
                  <>
                    <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-primary/20 bg-slate-900 group">
                      <Image src={selectedImage} alt="Preview" fill className="object-contain" />
                      <div className="absolute inset-0 bg-blue-500/10 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/80 shadow-[0_0_15px_rgba(29,78,216,0.8)] animate-scan-line"></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 rounded-xl h-10 font-bold text-xs" onClick={() => setSelectedImage(null)}>Chọn lại</Button>
                      <Button className="flex-1 rounded-xl h-10 font-bold text-xs bg-primary shadow-lg shadow-primary/20" onClick={handleScanPrescription} disabled={isScanning}>
                        {isScanning ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{ocrProgress}%</span>
                          </div>
                        ) : "BẮT ĐẦU QUÉT"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kết quả bóc tách ({scanResults.length})</p>
                        {isSearchingProducts && (
                          <span className="text-[10px] text-primary animate-pulse font-bold">Đang tìm sản phẩm khớp...</span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-primary font-bold" onClick={() => {
                        setShowResults(false);
                        setSearchResultsMap({});
                      }}>
                        Quay lại
                      </Button>
                    </div>
                    <ScrollArea className="h-[380px] pr-4">
                      <div className="grid gap-4">
                        {scanResults.map((result, idx) => {
                          const products = searchResultsMap[result] || [];
                          return (
                            <div key={idx} className="space-y-2">
                               <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all text-left">
                                  <span className="font-bold text-sm text-slate-700">{result}</span>
                                  {products.length === 0 && !isSearchingProducts && (
                                    <span className="text-[10px] text-slate-400 font-medium italic">Không tìm thấy sản phẩm khớp</span>
                                  )}
                               </div>
                               
                               {products.length > 0 && (
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                                   {products.map((p) => (
                                     <div 
                                      key={p.id} 
                                      onClick={() => {
                                        router.push(`/cua-hang?q=${encodeURIComponent(p.name)}`);
                                        setImageModalOpen(false);
                                      }}
                                      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-primary/10 hover:border-primary hover:shadow-md cursor-pointer transition-all group"
                                     >
                                       <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-50">
                                         <Image src={p.primaryImageUrl || "/placeholder.svg"} alt={p.name} fill className="object-contain" />
                                       </div>
                                       <div className="min-w-0">
                                          <p className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">{p.name}</p>
                                          <p className="text-[10px] font-black text-primary">{p.price?.toLocaleString("vi-VN")}đ</p>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    <p className="text-center text-[10px] text-slate-400 font-medium italic">
                      Mẹo: Nhấp vào tên thuốc để tìm kiếm trong cửa hàng
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Search Modal */}
      <Dialog open={voiceModalOpen} onOpenChange={(open) => { 
        setVoiceModalOpen(open); 
        if (!open) {
          setIsListening(false);
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {}
          }
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogTitle className="sr-only">Tìm kiếm bằng giọng nói</DialogTitle>
          <div className="bg-gradient-to-br from-indigo-600 via-primary to-blue-700 p-10 text-white relative overflow-hidden text-center">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300 rounded-full blur-3xl"></div>
             </div>
             <div className="relative z-10 flex flex-col items-center">
               <div className={cn("mb-6 h-20 w-20 rounded-full flex items-center justify-center relative", isListening ? "bg-white/20" : "bg-white/10")}>
                  {isListening && (
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
                  )}
                  <Mic className={cn("h-10 w-10 transition-all", isListening ? "text-white scale-110" : "text-white/60")} />
               </div>
               <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Tìm bằng giọng nói</h2>
               <p className="text-white/80 text-sm font-medium">Nói tên thuốc, triệu chứng hoặc thương hiệu bạn cần tìm</p>
             </div>
          </div>
          
          <div className="p-8 bg-white flex flex-col gap-6">
            <div className="min-h-[100px] flex items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 text-center italic text-slate-800 font-bold text-lg">
              {voiceQuery || (isListening ? "Đang lắng nghe..." : "Nhấn nút để bắt đầu nói")}
            </div>
            
            <div className="flex flex-col gap-3">
              {isListening ? (
                <Button 
                  className="w-full h-14 rounded-2xl font-black text-lg shadow-xl bg-destructive shadow-destructive/20 transition-all active:scale-95"
                  onClick={startVoiceSearch}
                >
                  DỪNG GHI ÂM
                </Button>
              ) : voiceQuery ? (
                <>
                  <Button 
                    className="w-full h-14 rounded-2xl font-black text-lg shadow-xl bg-primary shadow-primary/20 transition-all active:scale-95"
                    onClick={() => {
                      handleSearch(undefined, voiceQuery);
                      setVoiceModalOpen(false);
                    }}
                  >
                    TÌM KIẾM NGAY
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-14 rounded-2xl font-bold text-slate-600 border-2 border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
                    onClick={() => {
                      setVoiceQuery("");
                      voiceQueryRef.current = "";
                      startVoiceSearch();
                    }}
                  >
                    GHI ÂM LẠI
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full h-14 rounded-2xl font-black text-lg shadow-xl bg-primary shadow-primary/20 transition-all active:scale-95"
                  onClick={startVoiceSearch}
                >
                  BẮT ĐẦU NÓI
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
