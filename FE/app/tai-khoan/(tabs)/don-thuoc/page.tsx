"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileCheck, Plus, Loader2 } from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"

export default function PrescriptionsPage() {
  const [loading, setLoading] = useState(false)

  return (
    <Card className="animate-in fade-in slide-in-from-right-4 duration-500 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 px-8 py-6 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Đơn thuốc của tôi</CardTitle>
        <Button className="rounded-full bg-blue-600 hover:bg-blue-700 px-6 font-bold shadow-lg shadow-blue-500/20">
          <Plus className="h-4 w-4 mr-2" />
          Gửi đơn thuốc mới
        </Button>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { id: "DT001", date: "2024-03-20", status: "APPROVED", doctor: "BS. Nguyễn Văn An", hospital: "BV Bạch Mai" },
            { id: "DT002", date: "2024-03-15", status: "PENDING", doctor: "BS. Trần Thị Bình", hospital: "Phòng khám MedCare" }
          ].map((item) => (
            <div key={item.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-50 p-2.5 rounded-xl">
                  <FileCheck className="h-6 w-6 text-blue-600" />
                </div>
                <Badge className={`rounded-full font-bold px-3 py-1 ${
                  item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {item.status === 'APPROVED' ? 'Đã duyệt' : 'Đang chờ'}
                </Badge>
              </div>
              <h4 className="text-lg font-black text-slate-800 mb-1">Mã đơn: #{item.id}</h4>
              <p className="text-sm text-slate-400 font-medium mb-4 italic">Ngày gửi: {format(new Date(item.date), "dd/MM/yyyy")}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm">
                  <span className="text-slate-400 w-24 font-medium italic">Bác sĩ:</span>
                  <span className="text-slate-700 font-bold">{item.doctor}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-slate-400 w-24 font-medium italic">Bệnh viện:</span>
                  <span className="text-slate-700 font-bold">{item.hospital}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <Button variant="outline" className="flex-1 rounded-full border-slate-200 text-slate-600 font-bold h-10">
                    Chi tiết
                 </Button>
                 <Button className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 font-bold h-10 shadow-lg shadow-blue-500/10">
                    Đặt thuốc
                 </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 bg-slate-50 rounded-3xl p-6 border border-dashed border-slate-200 text-center">
          <p className="text-sm text-slate-500 font-medium italic">
            Dược sĩ MedCare luôn sẵn sàng tư vấn cho đơn thuốc của bạn 24/7.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
