import axiosInstance from "@/lib/axiosInstance"

const PROMOTION_PREFIX = "/promotion-service/api/vouchers"

export type DiscountType = "FIXED" | "PERCENT" | "FREESHIP"

export interface Voucher {
  id?: number
  code: string
  title: string
  description?: string
  discountType: DiscountType
  discountValue: number
  maxDiscount?: number
  minOrderValue?: number
  usageLimit: number
  limitPerUser?: number
  usedCount?: number
  excludePrescriptionDrugs?: boolean
  applicableProductId?: number
  applicableCategoryId?: number
  startAt?: string
  endAt?: string
  isActive?: boolean
  createdAt?: string
}

export const voucherService = {
  getAllVouchers: async (): Promise<Voucher[]> => {
    return axiosInstance.get(`${PROMOTION_PREFIX}/admin/all`)
  },

  getActiveVouchers: async (): Promise<Voucher[]> => {
    // This is a public endpoint, we use axiosInstance but it won't have token if guest
    return axiosInstance.get(`${PROMOTION_PREFIX}/active`)
  },

  saveVoucher: async (userId: number, code: string) => {
    return axiosInstance.post(`${PROMOTION_PREFIX}/user/save?userId=${userId}&code=${code}`)
  },

  getSavedVouchers: async (userId: number): Promise<Voucher[]> => {
    return axiosInstance.get(`${PROMOTION_PREFIX}/user/${userId}`)
  },
  
  createVoucher: async (voucher: Voucher) => {
    return axiosInstance.post(`${PROMOTION_PREFIX}/admin`, voucher)
  },
  
  updateVoucher: async (id: number, voucher: Voucher) => {
    return axiosInstance.put(`${PROMOTION_PREFIX}/admin/${id}`, voucher)
  },
  
  deleteVoucher: async (id: number) => {
    return axiosInstance.delete(`${PROMOTION_PREFIX}/admin/${id}`)
  },

  getTrashedVouchers: async (): Promise<Voucher[]> => {
    return axiosInstance.get(`${PROMOTION_PREFIX}/admin/trash`)
  },

  restoreVoucher: async (id: number) => {
    return axiosInstance.post(`${PROMOTION_PREFIX}/admin/${id}/restore`)
  },

  hardDeleteVoucher: async (id: number) => {
    return axiosInstance.delete(`${PROMOTION_PREFIX}/admin/${id}/hard`)
  }
}
