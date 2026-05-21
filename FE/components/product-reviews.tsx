"use client"

import { getApiBaseUrl } from "@/lib/config"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { Star, User, ShieldCheck, AlertCircle, ChevronDown, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import DOMPurify from "isomorphic-dompurify"
import { cn } from "@/lib/utils"

const sanitizeContent = (content: string) => {
  return {
    __html: DOMPurify.sanitize(content || "", {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "u", "span", "div"],
      ALLOWED_ATTR: ["class", "style"]
    })
  }
}

interface ReplyResponse {
  id: number
  staffId: number
  staffName: string
  staffRole: string
  content: string
  createdAt: string
}

interface Review {
  id: number
  productId: number
  userId?: number
  guestName?: string
  phoneNumber?: string
  email?: string
  rating: number
  comment: string
  isApproved: boolean
  createdAt: string
  updatedAt?: string
  productSlug?: string
  replies?: ReplyResponse[]
}

const REVIEWS_PER_PAGE = 3

interface ProductReviewsProps {
  productId: string
  productSlug: string
  productName: string
  productImage: string
  initialReviews: Review[]
  hideTitle?: boolean
}

export function ProductReviews({ productId, productSlug, productName, productImage, initialReviews, hideTitle = false }: ProductReviewsProps) {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role as string | undefined

  const isStaff = userRole === "ADMIN" || userRole === "PHARMACIST"
  const isRegularUser = !!session && !isStaff

  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE)

  // New review form state
  const [newReview, setNewReview] = useState({ rating: 0, guestName: "", phoneNumber: "", email: "", comment: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({ rating: "", guestName: "", phoneNumber: "", comment: "" })

  // Reply state (staff only)
  const [replyingToId, setReplyingToId] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isReplying, setIsReplying] = useState(false)

  // Edit review state (own reviews)
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ rating: 0, comment: "" })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
    : 5.0

  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({
    stars: r,
    count: reviews.filter(rev => rev.rating === r).length,
    percentage: reviews.length > 0 ? (reviews.filter(rev => rev.rating === r).length / reviews.length) * 100 : 0
  }))

  const filteredReviews = filterRating ? reviews.filter(r => r.rating === filterRating) : reviews
  const displayedReviews = filteredReviews.slice(0, visibleCount)

  const getAuthHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" }
    if (session?.user?.accessToken) h["Authorization"] = `Bearer ${session.user.accessToken}`
    return h
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = { rating: "", guestName: "", phoneNumber: "", comment: "" }
    let hasError = false

    if (newReview.rating === 0) { errors.rating = "Vui lòng chọn số sao đánh giá"; hasError = true }
    if (!session && !newReview.guestName.trim()) { errors.guestName = "Vui lòng nhập họ và tên"; hasError = true }
    if (!session) {
      if (!newReview.phoneNumber.trim()) { errors.phoneNumber = "Vui lòng nhập số điện thoại"; hasError = true }
      else if (!/^(0|84)[3|5|7|8|9][0-9]{8}$/.test(newReview.phoneNumber)) { errors.phoneNumber = "Số điện thoại không đúng định dạng"; hasError = true }
    }
    if (!newReview.comment.trim()) { errors.comment = "Vui lòng nhập nội dung đánh giá"; hasError = true }

    if (hasError) { setFormErrors(errors); return }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/review-service/api/reviews`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId: parseInt(productId),
          productSlug: productSlug,
          productName: productName,
          productImage: productImage,
          guestName: session ? session.user.fullName : newReview.guestName,
          phoneNumber: session ? (session.user as any)?.phone : newReview.phoneNumber,
          email: session ? session.user.email : newReview.email,
          rating: newReview.rating,
          comment: newReview.comment
        })
      })
      if (res.ok) {
        const saved = await res.json()
        setReviews([saved, ...reviews])
        setIsModalOpen(false)
        setNewReview({ rating: 0, guestName: "", phoneNumber: "", email: "", comment: "" })
        setFormErrors({ rating: "", guestName: "", phoneNumber: "", comment: "" })
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.message || "Có lỗi khi gửi đánh giá")
      }
    } catch (err) {
      console.error(err)
      alert("Có lỗi xảy ra khi gửi đánh giá.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSave = async (reviewId: number) => {
    setIsSavingEdit(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/review-service/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ rating: editForm.rating, comment: editForm.comment })
      })
      if (res.ok) {
        const updated = await res.json()
        setReviews(reviews.map(r => r.id === reviewId ? updated : r))
        setEditingReviewId(null)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.message || "Không thể chỉnh sửa đánh giá")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleReplySubmit = async (reviewId: number) => {
    if (!replyContent.trim() || !isStaff) return
    setIsReplying(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/review-service/api/reviews/${reviewId}/replies`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: replyContent })
      })
      if (res.ok) {
        const updated = await res.json()
        setReviews(reviews.map(r => r.id === reviewId ? updated : r))
        setReplyingToId(null)
        setReplyContent("")
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.message || "Không thể gửi phản hồi")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsReplying(false)
    }
  }

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Hôm nay"
    if (diffDays < 30) return `${diffDays} ngày trước`
    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths < 12) return `${diffMonths} tháng trước`
    return `${Math.floor(diffMonths / 12)} năm trước`
  }

  const startEdit = (review: Review) => {
    setEditingReviewId(review.id)
    setEditForm({ rating: review.rating, comment: review.comment })
  }

  return (
    <div className="mt-12 space-y-8">
      <div className={cn("bg-white rounded-3xl border border-gray-100 shadow-sm", hideTitle ? "p-0 border-none shadow-none" : "p-6 md:p-8")}>
        {!hideTitle && (
          <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
            Đánh giá sản phẩm <span className="text-gray-400 font-medium text-lg">({reviews.length} đánh giá)</span>
          </h2>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          {/* Average Box */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100 min-w-[140px]">
            <p className="text-sm font-bold text-slate-500 mb-2">Trung bình</p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-5xl font-black text-slate-800 tracking-tighter">{averageRating.toFixed(1).replace(".", ",")}</span>
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-[13px] font-bold px-6">
                  Gửi đánh giá
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-white border-b border-gray-50">
                  <DialogTitle className="text-xl font-black text-center text-slate-800">Đánh giá sản phẩm</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="relative w-16 h-16 rounded-xl bg-white border border-gray-100 overflow-hidden shrink-0">
                      <Image src={productImage} alt={productName} fill className="object-contain p-2" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 line-clamp-2">{productName}</p>
                  </div>

                  {/* Star Rating */}
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button"
                          onClick={() => { setNewReview({ ...newReview, rating: s }); if (formErrors.rating) setFormErrors({ ...formErrors, rating: "" }) }}
                          className="transition-transform hover:scale-110 active:scale-95"
                        >
                          <Star className={`w-10 h-10 ${s <= (newReview.rating || 0) ? "fill-yellow-400 text-yellow-400" : "fill-slate-100 text-slate-100"}`} />
                        </button>
                      ))}
                    </div>
                    {formErrors.rating ? (
                      <p className="text-xs text-destructive font-bold">{formErrors.rating}</p>
                    ) : newReview.rating > 0 ? (
                      <p className="text-sm font-bold text-yellow-600">
                        {newReview.rating === 5 ? "Tuyệt vời" : newReview.rating === 4 ? "Hài lòng" : newReview.rating === 3 ? "Bình thường" : newReview.rating === 2 ? "Tệ" : "Rất tệ"}
                      </p>
                    ) : null}
                  </div>

                  {/* Name & Phone - only for guests */}
                  {!session && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Input placeholder="Nhập họ và tên" required
                          className={`rounded-xl h-12 text-[14px] ${formErrors.guestName ? "border-destructive" : "border-gray-200"}`}
                          value={newReview.guestName}
                          onChange={e => { setNewReview({ ...newReview, guestName: e.target.value }); if (formErrors.guestName) setFormErrors({ ...formErrors, guestName: "" }) }}
                        />
                        {formErrors.guestName && <p className="text-[11px] text-destructive flex items-center gap-1 px-1"><AlertCircle size={12} /> {formErrors.guestName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Input placeholder="Số điện thoại" required
                          className={`rounded-xl h-12 text-[14px] ${formErrors.phoneNumber ? "border-destructive" : "border-gray-200"}`}
                          value={newReview.phoneNumber}
                          onChange={e => { setNewReview({ ...newReview, phoneNumber: e.target.value }); if (formErrors.phoneNumber) setFormErrors({ ...formErrors, phoneNumber: "" }) }}
                        />
                        {formErrors.phoneNumber && <p className="text-[11px] text-destructive flex items-center gap-1 px-1"><AlertCircle size={12} /> {formErrors.phoneNumber}</p>}
                      </div>
                    </div>
                  )}
                  {!session && (
                    <Input placeholder="Email (Không bắt buộc)" className="rounded-xl border-gray-200 h-12 text-[14px]"
                      value={newReview.email} onChange={e => setNewReview({ ...newReview, email: e.target.value })} />
                  )}

                  <div className="space-y-2">
                    <Textarea placeholder="Nhập nội dung đánh giá (Vui lòng gõ tiếng Việt có dấu)..." required
                      className={`rounded-2xl min-h-[120px] text-[14px] p-4 resize-none ${formErrors.comment ? "border-destructive" : "border-gray-200"}`}
                      value={newReview.comment}
                      onChange={e => { setNewReview({ ...newReview, comment: e.target.value }); if (formErrors.comment) setFormErrors({ ...formErrors, comment: "" }) }}
                    />
                    {formErrors.comment && <p className="text-[11px] text-destructive flex items-center gap-1 px-1"><AlertCircle size={12} /> {formErrors.comment}</p>}
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-base font-black shadow-lg shadow-blue-100">
                    {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Rating Bars */}
          <div className="flex-1 space-y-3 w-full">
            {ratingCounts.map((r) => (
              <div key={r.stars} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-10 shrink-0">
                  <span className="text-xs font-bold text-slate-600">{r.stars}</span>
                  <Star className="w-3 h-3 fill-slate-300 text-slate-300" />
                </div>
                <Progress value={r.percentage} className="h-2 bg-slate-100" />
                <span className="text-xs font-medium text-slate-400 w-8">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-10 pt-8 border-t border-gray-50">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-slate-600 mr-2">Lọc theo:</span>
            {[null, 5, 4, 3, 2, 1].map((r) => (
              <button key={r === null ? "all" : r} onClick={() => { setFilterRating(r); setVisibleCount(REVIEWS_PER_PAGE) }}
                className={`px-5 py-1.5 rounded-full text-[13px] font-bold border transition-all h-9 flex items-center justify-center ${filterRating === r
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                  : "bg-white border-gray-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50/30"
                }`}
              >
                {r === null ? "Tất cả" : `${r} sao`}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="mt-8 space-y-0 text-[14px]">
          {filteredReviews.length > 0 ? (
            <>
              {displayedReviews.map((review) => (
                <div key={review.id} className="py-8 border-b border-gray-50 last:border-0 group">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 shadow-sm group-hover:bg-blue-50 transition-colors">
                      <User className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="font-black text-slate-800">{review.guestName || "Người dùng ẩn danh"}</p>
                        <span className="text-[12px] text-gray-400 font-medium">{getTimeAgo(review.createdAt)}</span>
                      </div>

                      {/* Editing mode */}
                      {editingReviewId === review.id ? (
                        <div className="space-y-3">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <button key={s} type="button" onClick={() => setEditForm(f => ({ ...f, rating: s }))}>
                                <Star className={`w-7 h-7 ${s <= editForm.rating ? "fill-yellow-400 text-yellow-400" : "fill-slate-100 text-slate-100"}`} />
                              </button>
                            ))}
                          </div>
                          <Textarea className="min-h-[80px] text-[13px] rounded-xl resize-none"
                            value={editForm.comment} onChange={e => setEditForm(f => ({ ...f, comment: e.target.value }))} />
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" className="h-8 text-[12px]" onClick={() => setEditingReviewId(null)}>Hủy</Button>
                            <Button size="sm" className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-[12px]"
                              disabled={isSavingEdit} onClick={() => handleEditSave(review.id)}>
                              {isSavingEdit ? "Lưu..." : "Lưu thay đổi"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-slate-100 text-slate-100"}`} />
                            ))}
                          </div>
                          <div className="text-slate-600 leading-relaxed pt-1" dangerouslySetInnerHTML={sanitizeContent(review.comment)} />
                          {review.updatedAt && review.updatedAt !== review.createdAt && (
                            <p className="text-[11px] text-slate-400 italic">Đã chỉnh sửa • {getTimeAgo(review.updatedAt)}</p>
                          )}
                        </>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-4 pt-1">
                        {/* Edit button - only show for own reviews */}
                        {isRegularUser && session && (session.user as any)?.id && review.userId === Number((session.user as any)?.id) && editingReviewId !== review.id && (
                          <button onClick={() => startEdit(review)} className="flex items-center gap-1 text-slate-500 hover:text-blue-600 text-[12px] font-bold transition-colors">
                            <Pencil size={12} /> Chỉnh sửa
                          </button>
                        )}
                        {/* Reply button - only for staff */}
                        {isStaff && (
                          <button onClick={() => { setReplyingToId(replyingToId === review.id ? null : review.id); setReplyContent("") }}
                            className="text-blue-600 font-bold text-[13px] hover:underline">
                            {replyingToId === review.id ? "Hủy trả lời" : "Trả lời"}
                          </button>
                        )}
                      </div>

                      {/* Reply form - staff only */}
                      {isStaff && replyingToId === review.id && (
                        <div className="mt-3 space-y-3 p-4 bg-blue-50/30 rounded-2xl border border-blue-100">
                          <Textarea placeholder="Viết phản hồi với tư cách dược sĩ / quản trị viên..."
                            className="min-h-[80px] text-[13px] bg-white resize-none"
                            value={replyContent} onChange={e => setReplyContent(e.target.value)} />
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 text-[12px] font-bold" onClick={() => setReplyingToId(null)}>Hủy</Button>
                            <Button size="sm" className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-[12px] font-bold"
                              disabled={isReplying} onClick={() => handleReplySubmit(review.id)}>
                              {isReplying ? "Đang gửi..." : "Gửi phản hồi"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {review.replies && review.replies.map(reply => (
                        <div key={reply.id} className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative ml-2 before:content-[''] before:absolute before:-top-4 before:left-4 before:w-px before:h-4 before:bg-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                              <ShieldCheck className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="font-black text-slate-800 text-[13px] flex items-center gap-1.5">
                              {reply.staffName}
                              <Badge className={`border-none py-0 px-1.5 h-auto text-[10px] font-bold ${reply.staffRole === "PHARMACIST" ? "bg-blue-600 text-white" : "bg-slate-700 text-white"}`}>
                                {reply.staffRole === "PHARMACIST" ? "Dược Sĩ" : "Quản Trị"}
                              </Badge>
                            </p>
                          </div>
                          <div className="text-slate-600 leading-relaxed text-[13px]" dangerouslySetInnerHTML={sanitizeContent(reply.content)} />
                          <span className="text-[11px] text-gray-400 font-medium mt-2 block">{getTimeAgo(reply.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Show more / show less */}
              {filteredReviews.length > REVIEWS_PER_PAGE && (
                <div className="pt-4 flex justify-center">
                  {visibleCount < filteredReviews.length ? (
                    <Button variant="outline" size="sm"
                      className="rounded-full border-gray-200 text-slate-600 font-bold gap-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                      onClick={() => setVisibleCount(v => v + REVIEWS_PER_PAGE)}>
                      <ChevronDown size={16} /> Xem thêm ({filteredReviews.length - visibleCount} đánh giá)
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm"
                      className="rounded-full text-slate-400 font-bold text-[12px]"
                      onClick={() => setVisibleCount(REVIEWS_PER_PAGE)}>
                      Thu gọn
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Star className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-medium italic">Chưa có đánh giá nào {filterRating ? `cho mức ${filterRating} sao` : ""}</p>
              <Button variant="link" className="text-blue-600 font-bold mt-2" onClick={() => setIsModalOpen(true)}>Trở thành người đầu tiên đánh giá!</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
