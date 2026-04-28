import axiosInstance from "@/lib/axiosInstance"

const PRODUCT_PREFIX = "/product-service/api"

export interface ProductImage {
  imageUrl: string
  isPrimary: boolean
  sortOrder: number
}

export interface ProductPayload {
  // Medicines Table
  sourceSku?: string
  name: string
  slug?: string
  categoryId: number
  registrationNumber?: string
  requiresPrescription: boolean
  packingUnit?: string
  
  // Prices
  originalPrice?: number
  discountPercentage?: number
  price: number // Final price
  
  // Details
  brand?: string
  manufacturer?: string
  countryOfOrigin?: string
  dosageForm?: string
  expiryDate?: string
  activeIngredients?: string
  description?: string
  indications?: string
  usageInstruction?: string
  contraindications?: string
  sideEffects?: string
  precautions?: string
  storageConditions?: string
  
  // Images
  images?: ProductImage[]
  primaryImageUrl?: string
  
  // AI
  symptoms?: string[] 

  // Initial Stock (Optional)
  initialQuantity?: number
  initialBatchNumber?: string
  initialExpiryDate?: string
}

export const productService = {
  getProducts: async () => {
    const res = await axiosInstance.get(`${PRODUCT_PREFIX}/products?size=1000`) as any;
    return res.content || res; // Handles Paginated Response
  },
  
  getProductById: async (id: number) => {
    return axiosInstance.get(`${PRODUCT_PREFIX}/products/${id}`) as Promise<any>
  },

  getProductBySlug: async (slug: string) => {
    return axiosInstance.get(`${PRODUCT_PREFIX}/products/slug/${slug}`) as Promise<any>
  },

  getProductsByCategorySlug: async (slug: string, page: number = 0, size: number = 15) => {
    return axiosInstance.get(`${PRODUCT_PREFIX}/products/category/slug/${slug}?page=${page}&size=${size}`) as Promise<any>
  },

  createProduct: async (data: ProductPayload) => {
    return axiosInstance.post(`${PRODUCT_PREFIX}/products`, data) as Promise<any>
  },

  updateProduct: async (id: number, data: ProductPayload) => {
    return axiosInstance.put(`${PRODUCT_PREFIX}/products/${id}`, data) as Promise<any>
  },

  deleteProduct: async (id: number) => {
    return axiosInstance.delete(`${PRODUCT_PREFIX}/products/${id}`) as Promise<any>
  },

  getBrands: async () => {
    return axiosInstance.get(`${PRODUCT_PREFIX}/products/brands`) as Promise<string[]>
  },

  getOrigins: async () => {
    return axiosInstance.get(`${PRODUCT_PREFIX}/products/origins`) as Promise<string[]>
  },

  getDeletedProducts: async () => {
    return axiosInstance.get(`${PRODUCT_PREFIX}/products/deleted`) as Promise<any[]>
  },

  restoreProduct: async (id: number) => {
    return axiosInstance.post(`${PRODUCT_PREFIX}/products/restore/${id}`) as Promise<any>
  },

  hardDeleteProduct: async (id: number) => {
    return axiosInstance.delete(`${PRODUCT_PREFIX}/products/hard-delete/${id}`) as Promise<any>
  },

  getCategories: async () => {
    return axiosInstance.get(`${PRODUCT_PREFIX}/categories`) as Promise<any[]>
  },

  getCategoryTree: async () => {
    return axiosInstance.get(`${PRODUCT_PREFIX}/categories/tree`) as Promise<any[]>
  },

  createCategory: async (data: any) => {
    return axiosInstance.post(`${PRODUCT_PREFIX}/categories`, data) as Promise<any>
  },

  updateCategory: async (id: number, data: any) => {
    return axiosInstance.put(`${PRODUCT_PREFIX}/categories/${id}`, data) as Promise<any>
  },

  deleteCategory: async (id: number) => {
    return axiosInstance.delete(`${PRODUCT_PREFIX}/categories/${id}`) as Promise<any>
  },

  getTrashedCategories: async () => {
    return axiosInstance.get(`${PRODUCT_PREFIX}/categories/trash`) as Promise<any[]>
  },

  restoreCategory: async (id: number) => {
    return axiosInstance.post(`${PRODUCT_PREFIX}/categories/${id}/restore`) as Promise<any>
  },

  hardDeleteCategory: async (id: number) => {
    return axiosInstance.delete(`${PRODUCT_PREFIX}/categories/${id}/hard`) as Promise<any>
  },

  searchProducts: async (query: string, page: number = 0, size: number = 5) => {
    return axiosInstance.get(`${PRODUCT_PREFIX}/products/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`) as Promise<any>
  }
}
