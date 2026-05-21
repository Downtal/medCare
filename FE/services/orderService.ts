import axiosInstance from "@/lib/axiosInstance"

const ORDER_PREFIX = "/order-service/api/orders"

export interface OrderItem {
  id: number
  medicineId: number
  medicineName: string
  imageUrl?: string
  quantity: number
  unitPrice: number
  subTotal: number
}

export interface OrderStatusLog {
  status: OrderStatus
  note: string
  createdAt: string
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPING" | "DELIVERED" | "CANCELLED" | "PENDING_PRESCRIPTION" | "PAID"

export interface Order {
  id: number
  orderCode: string
  userId: number
  totalPrice: number
  shippingFee: number
  grandTotal: number
  status: OrderStatus
  paymentMethod: string
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  prescriptionImageUrl?: string
  voucherCode?: string
  discountAmount?: number
  note?: string
  createdAt: string
  items: OrderItem[]
  statusLogs?: OrderStatusLog[]
  deletedAt?: string
}

export const orderService = {
  getMyOrders: async (): Promise<Order[]> => {
    return axiosInstance.get(`${ORDER_PREFIX}/my-orders`)
  },

  getAllOrders: async (): Promise<Order[]> => {
    return axiosInstance.get(`${ORDER_PREFIX}/admin/all`)
  },

  getTrashedOrders: async (): Promise<Order[]> => {
    return axiosInstance.get(`${ORDER_PREFIX}/admin/trash`)
  },

  getOrderById: async (id: number): Promise<Order> => {
    return axiosInstance.get(`${ORDER_PREFIX}/${id}`)
  },

  getOrderByCode: async (orderCode: string): Promise<Order> => {
    return axiosInstance.get(`${ORDER_PREFIX}/${orderCode}`)
  },

  updateOrderStatus: async (id: number, status: OrderStatus) => {
    return axiosInstance.put(`${ORDER_PREFIX}/${id}/status`, { status })
  },

  deleteOrder: async (id: number): Promise<void> => {
    return axiosInstance.delete(`${ORDER_PREFIX}/admin/${id}`)
  },

  restoreOrder: async (id: number): Promise<void> => {
    return axiosInstance.post(`${ORDER_PREFIX}/admin/${id}/restore`)
  },

  hardDeleteOrder: async (id: number): Promise<void> => {
    return axiosInstance.delete(`${ORDER_PREFIX}/admin/${id}/hard`)
  },

  getStatistics: async (days: number = 30): Promise<OrderStatistics> => {
    return axiosInstance.get(`${ORDER_PREFIX}/admin/statistics?days=${days}`)
  }
}

export interface OrderStatistics {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  pendingOrders: number
  shippingOrders: number
  completedOrders: number
  revenueGrowth: number
  ordersGrowth: number
  aovGrowth: number
  completionGrowth: number
  revenueTrend: Array<{
    period: string
    revenue: number
    orderCount: number
  }>
  topProducts: Array<{
    productId: number
    productName: string
    quantitySold: number
    totalRevenue: number
  }>
  paymentMethodDistribution: Record<string, number>
}
