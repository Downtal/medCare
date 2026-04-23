import axiosInstance from "@/lib/axiosInstance"

const SHIPPING_PREFIX = "/shipping-service/api/shipping"

export interface ShippingFeeRequest {
  toDistrictId: number
  toWardCode: string
  weight?: number
  length?: number
  width?: number
  height?: number
  insuranceValue?: number
  serviceTypeId?: number
}

export interface Province {
  ProvinceID: number
  ProvinceName: string
}

export interface District {
  DistrictID: number
  DistrictName: string
}

export interface Ward {
  WardCode: string
  WardName: string
}

export const shippingService = {
  getProvinces: async (): Promise<Province[]> => {
    return axiosInstance.get(`${SHIPPING_PREFIX}/provinces`)
  },

  getDistricts: async (provinceId: number): Promise<District[]> => {
    return axiosInstance.get(`${SHIPPING_PREFIX}/districts`, {
      params: { provinceId }
    })
  },

  getWards: async (districtId: number): Promise<Ward[]> => {
    return axiosInstance.get(`${SHIPPING_PREFIX}/wards`, {
      params: { districtId }
    })
  },

  calculateFee: async (data: ShippingFeeRequest): Promise<any> => {
    const defaultData = {
      weight: 200,
      length: 10,
      width: 10,
      height: 10,
      insuranceValue: 0,
      serviceTypeId: 2 // Hàng nhẹ
    }
    return axiosInstance.post(`${SHIPPING_PREFIX}/fee`, { ...defaultData, ...data })
  },

  getTrackingHistory: async (trackingCode: string): Promise<any> => {
    return axiosInstance.get(`${SHIPPING_PREFIX}/tracking/${trackingCode}/history`)
  }
}
