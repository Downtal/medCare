import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, Eye, MessageCircle } from "lucide-react"
import Image from "next/image"

interface Prescription {
  id: string
  uploadDate: string
  status: "pending" | "approved" | "rejected"
  image: string
  pharmacistNote?: string
  rejectionReason?: string
  reviewDate?: string
}

interface PrescriptionStatusProps {
  prescriptions: Prescription[]
}

export function PrescriptionStatus({ prescriptions }: PrescriptionStatusProps) {
  const getStatusBadge = (status: Prescription["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning">
            <Clock className="h-3 w-3 mr-1" />
            Đang chờ duyệt
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-success/10 text-success-foreground border-success">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Đã duyệt
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Từ chối
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      {prescriptions.map((prescription) => (
        <Card key={prescription.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base mb-2">Đơn thuốc #{prescription.id}</CardTitle>
                <p className="text-sm text-muted-foreground">Ngày gửi: {prescription.uploadDate}</p>
              </div>
              {getStatusBadge(prescription.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Image Preview */}
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border bg-secondary">
                <Image
                  src={prescription.image || "/placeholder.svg"}
                  alt={`Đơn thuốc ${prescription.id}`}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Details */}
              <div className="space-y-3">
                {prescription.status === "approved" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-success">✓ Đơn thuốc đã được dược sĩ xác nhận</p>
                    {prescription.reviewDate && (
                      <p className="text-sm text-muted-foreground">Ngày duyệt: {prescription.reviewDate}</p>
                    )}
                    {prescription.pharmacistNote && (
                      <div className="p-3 bg-success/10 rounded-lg">
                        <p className="text-sm font-medium mb-1">Ghi chú của dược sĩ:</p>
                        <p className="text-sm">{prescription.pharmacistNote}</p>
                      </div>
                    )}
                    <Button className="w-full" size="sm">
                      Đặt hàng theo đơn
                    </Button>
                  </div>
                )}

                {prescription.status === "pending" && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Dược sĩ đang xem xét đơn thuốc của bạn. Thời gian duyệt thường trong vòng 2-4 giờ.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Liên hệ
                      </Button>
                    </div>
                  </div>
                )}

                {prescription.status === "rejected" && (
                  <div className="space-y-2">
                    <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="text-sm font-medium mb-1 text-destructive">Lý do từ chối:</p>
                      <p className="text-sm">{prescription.rejectionReason}</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      Tải lên lại
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Xem chi tiết
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
