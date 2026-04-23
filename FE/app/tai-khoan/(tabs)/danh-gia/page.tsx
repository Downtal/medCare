"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, MessageSquare, Loader2, Calendar } from "lucide-react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getApiBaseUrl } from "@/lib/config"
import { format } from "date-fns"
import { toast } from "sonner"

export default function ReviewsPage() {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchReviews()
    }
  }, [session])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${getApiBaseUrl()}/review-service/api/reviews/my-reviews`, {
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setReviews(data)
      }
    } catch (error) {
      console.error("Fetch reviews error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-bold">Đang tải đánh giá...</p>
      </div>
    )
  }

  return (
    <Card className="animate-in fade-in slide-in-from-right-4 duration-500 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 px-8 py-6 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Đánh giá của tôi</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-current" : "text-slate-200"}`} />
                    ))}
                  </div>
                  <div className="flex items-center text-xs text-slate-400 font-bold italic">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(review.createdAt), "dd/MM/yyyy")}
                  </div>
                </div>
                <p className="text-slate-700 font-medium mb-4 leading-relaxed italic">"{review.comment}"</p>
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 border border-slate-100">
                   <div className="bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                      <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                         <MessageSquare className="h-6 w-6 text-blue-600" />
                      </div>
                   </div>
                   <div className="min-w-0">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-0.5">Sản phẩm</p>
                      <p className="text-sm text-slate-800 font-black truncate">{review.medicineName || "Sản phẩm MedCare"}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mx-auto mb-6">
              <Star className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Chưa có đánh giá nào</h3>
            <p className="text-slate-400 font-medium italic mb-8">Chia sẻ trải nghiệm của bạn về sản phẩm để giúp cộng đồng MedCare nhé.</p>
            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 font-black px-8 h-12 shadow-lg shadow-blue-500/20">
              Viết đánh giá ngay
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
