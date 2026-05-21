"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, MessageSquare, Loader2, Calendar, Pencil, AlertCircle, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getApiBaseUrl } from "@/lib/config"
import { format } from "date-fns"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export default function ReviewsPage() {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<any>(null)
  const [editRating, setEditRating] = useState(0)
  const [editComment, setEditComment] = useState("")
  const [isSaving, setIsSaving] = useState(false)

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

  const canEdit = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffInDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return diffInDays <= 7;
  }

  const handleStartEdit = (review: any) => {
    setEditingReview(review)
    setEditRating(review.rating)
    setEditComment(review.comment)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingReview) return
    if (editRating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá.")
      return
    }
    if (!editComment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/review-service/api/reviews/${editingReview.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify({
          rating: editRating,
          comment: editComment
        })
      })

      if (res.ok) {
        toast.success("Cập nhật đánh giá thành công!")
        setIsEditDialogOpen(false)
        fetchReviews()
      } else {
        toast.error("Không thể cập nhật đánh giá.")
      }
    } catch (error) {
      console.error("Edit review error:", error)
      toast.error("Có lỗi xảy ra khi cập nhật.")
    } finally {
      setIsSaving(false)
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
    <>
      <Card className="animate-in fade-in slide-in-from-right-4 duration-500 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-100 px-8 py-6 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Đánh giá của tôi</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => {
                const editable = canEdit(review.createdAt);
                return (
                  <div key={review.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-current" : "text-slate-200"}`} />
                        ))}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center text-xs text-slate-400 font-bold italic">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(review.createdAt), "dd/MM/yyyy")}
                        </div>
                        {editable && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-xs gap-1.5"
                            onClick={() => handleStartEdit(review)}
                          >
                            <Pencil className="h-3 w-3" /> Chỉnh sửa
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-slate-700 font-medium mb-4 leading-relaxed italic">"{review.comment}"</p>
                    
                    <Link 
                      href={review.productSlug ? `/san-pham/${review.productSlug}` : "#"}
                      className={`relative z-10 bg-slate-50 p-4 rounded-2xl flex items-center gap-4 border border-slate-100 transition-all ${review.productSlug ? "hover:bg-blue-50 hover:border-blue-300 hover:shadow-md cursor-pointer" : "cursor-default opacity-80"}`}
                    >
                      <div className="bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                        <div className="relative h-12 w-12 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                          {review.productImage ? (
                            <Image 
                              src={review.productImage} 
                              alt={review.productName || review.medicineName || "Sản phẩm MedCare"} 
                              fill 
                              className="object-contain p-1" 
                            />
                          ) : (
                            <MessageSquare className="h-6 w-6 text-blue-600" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Sản phẩm</p>
                        <p className="text-sm text-slate-800 font-black truncate">{review.productName || review.medicineName || "Sản phẩm MedCare"}</p>
                      </div>
                    </Link>
                  </div>
                );
              })}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-blue-600 text-white text-center">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Chỉnh sửa đánh giá</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="relative h-14 w-14 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                <Image 
                  src={editingReview?.productImage || "/placeholder.svg"} 
                  alt={editingReview?.productName || editingReview?.medicineName || "Product"} 
                  fill 
                  className="object-contain p-1" 
                />
              </div>
              <p className="text-sm font-bold text-slate-800 line-clamp-2">{editingReview?.productName || editingReview?.medicineName}</p>
            </div>

            <div className="space-y-4">
              <Label text="Số sao của bạn" />
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditRating(s)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star className={`h-10 w-10 ${s <= editRating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label text="Nội dung đánh giá" />
              <Textarea
                placeholder="Vui lòng chia sẻ cảm nhận của bạn..."
                className="min-h-[120px] rounded-2xl border-slate-200 focus:border-blue-400 resize-none p-4"
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-[11px] text-amber-700 font-medium">
                Bạn chỉ có thể chỉnh sửa đánh giá này trong vòng 7 ngày kể từ khi tạo.
              </p>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-full border-slate-200 font-bold h-12 text-slate-600"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 font-bold h-12 shadow-lg shadow-blue-500/20"
              disabled={isSaving}
              onClick={handleSaveEdit}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Label({ text }: { text: string }) {
  return <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{text}</p>
}
