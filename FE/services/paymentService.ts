import axiosInstance from "@/lib/axiosInstance"

const PAYMENT_PREFIX = "/payment-service/api/payment"

export interface PaymentRequest {
  orderId: number
  orderCode: string
  amount: number
  description: string
}

export interface PaymentResponse {
  status: string
  message: string
  paymentUrl: string
}

export interface PaymentResult {
  orderId: string
  amount: string
  responseCode: string
  transactionNo: string
  message: string
  success: boolean
}

export const paymentService = {
  createPaymentUrl: async (data: PaymentRequest): Promise<PaymentResponse> => {
    return axiosInstance.post(`${PAYMENT_PREFIX}/create`, data)
  },

  verifyCallback: async (params: Record<string, string>): Promise<PaymentResult> => {
    return axiosInstance.get(`${PAYMENT_PREFIX}/vnpay-callback`, { params })
  }
}
