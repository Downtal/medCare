import Link from "next/link"
import { Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-primary">MedCare</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Nhà thuốc trực tuyến uy tín, chuyên cung cấp thuốc chính hãng với giá tốt nhất.
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>1900 1234</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>support@medcare.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>123 Đường ABC, Quận 1, TP.HCM</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Liên kết nhanh</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/gioi-thieu" className="hover:text-primary transition-colors">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/lien-he" className="hover:text-primary transition-colors">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link href="/he-thong-cua-hang" className="hover:text-primary transition-colors">
                  Hệ thống cửa hàng
                </Link>
              </li>
              <li>
                <Link href="/tuyen-dung" className="hover:text-primary transition-colors">
                  Tuyển dụng
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4">Hỗ trợ khách hàng</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/huong-dan-mua-hang" className="hover:text-primary transition-colors">
                  Hướng dẫn mua hàng
                </Link>
              </li>
              <li>
                <Link href="/chinh-sach-doi-tra" className="hover:text-primary transition-colors">
                  Chính sách đổi trả
                </Link>
              </li>
              <li>
                <Link href="/chinh-sach-bao-mat" className="hover:text-primary transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/dieu-khoan-su-dung" className="hover:text-primary transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
            </ul>
          </div>

          {/* Certifications */}
          <div>
            <h3 className="font-semibold mb-4">Chứng nhận</h3>
            <p className="text-sm text-muted-foreground mb-3">Giấy phép kinh doanh số: 0123456789</p>
            <p className="text-sm text-muted-foreground mb-3">Chứng nhận GPP/GDP</p>
            <div className="flex gap-2">
              <div className="h-16 w-16 rounded border border-border bg-background flex items-center justify-center">
                <span className="text-xs text-center">GPP</span>
              </div>
              <div className="h-16 w-16 rounded border border-border bg-background flex items-center justify-center">
                <span className="text-xs text-center">GDP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2025 MedCare. Tất cả quyền được bảo lưu.</p>
            <p className="text-xs text-center">
              Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
