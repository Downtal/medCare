import axiosInstance from "@/lib/axiosInstance"

const REVIEW_PREFIX = "/review-service/api/reviews"

export interface ReviewReply {
  id: number
  staffId: number
  staffName: string
  staffRole: string
  content: string
  createdAt: string
}

export interface ReviewResponse {
  id: number
  productId: number
  productSlug: string
  productName: string
  productImage: string
  brand?: string
  registrationNumber?: string
  countryOfOrigin?: string
  rating: number
  comment: string
  guestName?: string
  userId?: number
  phoneNumber?: string
  email?: string
  isApproved: boolean
  createdAt: string
  replies: ReviewReply[]
}

export interface ProductReviewSummary {
  productId: number
  productName: string
  productSlug: string
  productImage: string
  brand?: string
  registrationNumber?: string
  countryOfOrigin?: string
  totalReviews: number
  averageRating: number
  unrepliedCount: number
}

export const reviewService = {
  getAllReviews: async (): Promise<ReviewResponse[]> => {
    return axiosInstance.get(`${REVIEW_PREFIX}/admin/all`)
  },

  getProductSummaries: async (): Promise<ProductReviewSummary[]> => {
    return axiosInstance.get(`${REVIEW_PREFIX}/admin/summaries`)
  },

  getUnrepliedReviews: async (): Promise<ReviewResponse[]> => {
    return axiosInstance.get(`${REVIEW_PREFIX}/admin/unreplied`)
  },
  
  replyToReview: async (reviewId: number, content: string) => {
    return axiosInstance.post(`${REVIEW_PREFIX}/${reviewId}/replies`, { content })
  },

  updateReply: async (replyId: number, content: string) => {
    return axiosInstance.put(`${REVIEW_PREFIX}/replies/${replyId}`, { content })
  },
  
  deleteReview: async (reviewId: number) => {
    return axiosInstance.delete(`${REVIEW_PREFIX}/admin/${reviewId}`)
  },

  getTrashedReviews: async (): Promise<ReviewResponse[]> => {
    return axiosInstance.get(`${REVIEW_PREFIX}/admin/trash`)
  },

  restoreReview: async (reviewId: number) => {
    return axiosInstance.post(`${REVIEW_PREFIX}/admin/${reviewId}/restore`, {})
  },

  hardDeleteReview: async (reviewId: number) => {
    return axiosInstance.delete(`${REVIEW_PREFIX}/admin/${reviewId}/hard`)
  }
}
