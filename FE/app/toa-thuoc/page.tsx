"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { UploadPrescription } from "@/components/upload-prescription"
import { PrescriptionStatus } from "@/components/prescription-status"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield } from "lucide-react"

export default function PrescriptionPage() {
  const prescriptions = [
    {
      id: "RX-2024-001",
      uploadDate: "15/12/2024 10:30",
      status: "approved" as const,
      image: "/prescription-example.jpg",
      pharmacistNote: "Đơn thuốc hợp lệ. Vui lòng uống thuốc sau bữa ăn và không vượt quá liều lượng.",
      reviewDate: "15/12/2024 11:45",
    },
    {
      id: "RX-2024-002",
      uploadDate: "14/12/2024 15:20",
      status: "pending" as const,
      image: "/prescription-example.jpg",
    },
    {
      id: "RX-2024-003",
      uploadDate: "13/12/2024 09:15",
      status: "rejected" as const,
      image: "/prescription-example.jpg",
      rejectionReason:
        "Đơn thuốc không rõ ràng, vui lòng chụp lại với độ phân giải cao hơn. Đảm bảo chữ ký bác sĩ và ngày kê đơn hiển thị rõ ràng.",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Quản lý toa thuốc</h1>
            <p className="text-muted-foreground">
              Tải lên toa thuốc của bác sĩ để được dược sĩ xác nhận và đặt hàng thuốc kê đơn
            </p>
          </div>

          {/* Security Notice */}
          <Alert className="mb-8 border-primary/20 bg-primary/5">
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong>Bảo mật thông tin:</strong> Toa thuốc của bạn được mã hóa và chỉ dược sĩ có thẩm quyền mới có thể
              xem. Chúng tôi tuân thủ nghiêm ngặt quy định về bảo mật thông tin y tế.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-2 mb-8">
              <TabsTrigger value="upload">Tải lên mới</TabsTrigger>
              <TabsTrigger value="history">Lịch sử toa thuốc</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <UploadPrescription onUploadComplete={(id) => console.log("Uploaded:", id)} />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              {prescriptions.length > 0 ? (
                <PrescriptionStatus prescriptions={prescriptions} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Bạn chưa có toa thuốc nào</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
