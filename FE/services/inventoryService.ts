import axiosInstance from "@/lib/axiosInstance"

const INVENTORY_PREFIX = "/inventory-service/api/inventory"

export interface InventoryBatch {
  id: number
  medicineId: number
  medicineName?: string
  medicineSlug?: string
  medicineImage?: string
  brand?: string
  registrationNumber?: string
  countryOfOrigin?: string
  warehouseId: number
  warehouseName: string
  batchNumber: string
  expiryDate: string
  quantityAvailable: number
  quantityReserved: number
}

export interface InventoryImportRequest {
  medicineId: number
  medicineName: string
  medicineSlug: string
  medicineImage: string
  brand?: string
  registrationNumber?: string
  countryOfOrigin?: string
  warehouseId: number
  batchNumber: string
  expiryDate: string
  quantity: number
  notes?: string
}

export interface ProductStockSummary {
  medicineId: number
  medicineName: string
  medicineSlug: string
  medicineImage: string
  brand?: string
  registrationNumber?: string
  countryOfOrigin?: string
  totalQuantity: number
  totalReserved: number
  batchCount: number
}

export interface Warehouse {
  id: number
  name: string
  address: string
  status: boolean
  deletedAt?: string
}

export interface InventoryLog {
  id: number
  medicineId: number
  batchId?: number
  actorId?: number
  changeType: 'IN' | 'OUT' | 'RESERVE' | 'RELEASE' | 'ADJUST'
  quantity: number
  referenceId?: string
  notes?: string
  createdAt: string
}

export const inventoryService = {
  getBatches: async (): Promise<InventoryBatch[]> => {
    return axiosInstance.get(`${INVENTORY_PREFIX}/batches`)
  },

  importStock: async (request: InventoryImportRequest): Promise<InventoryBatch> => {
    return axiosInstance.post(`${INVENTORY_PREFIX}/import`, request)
  },

  importStockBulk: async (requests: InventoryImportRequest[]): Promise<InventoryBatch[]> => {
    return axiosInstance.post(`${INVENTORY_PREFIX}/import/bulk`, requests)
  },


  getProductSummaries: async (): Promise<ProductStockSummary[]> => {
    return axiosInstance.get(`${INVENTORY_PREFIX}/products/summary`)
  },

  getProductStock: async (productId: number): Promise<number> => {
    return axiosInstance.get(`${INVENTORY_PREFIX}/product/${productId}/stock`)
  },

  // --- Warehouse Management ---
  getAllWarehouses: async (): Promise<Warehouse[]> => {
    return axiosInstance.get(`${INVENTORY_PREFIX}/warehouses`)
  },

  getTrashedWarehouses: async (): Promise<Warehouse[]> => {
    return axiosInstance.get(`${INVENTORY_PREFIX}/warehouses/trash`)
  },

  createWarehouse: async (data: Partial<Warehouse>): Promise<Warehouse> => {
    return axiosInstance.post(`${INVENTORY_PREFIX}/warehouses`, data)
  },

  updateWarehouse: async (id: number, data: Partial<Warehouse>): Promise<Warehouse> => {
    return axiosInstance.put(`${INVENTORY_PREFIX}/warehouses/${id}`, data)
  },

  deleteWarehouse: async (id: number): Promise<void> => {
    return axiosInstance.delete(`${INVENTORY_PREFIX}/warehouses/${id}`)
  },

  restoreWarehouse: async (id: number): Promise<void> => {
    return axiosInstance.post(`${INVENTORY_PREFIX}/warehouses/${id}/restore`)
  },

  hardDeleteWarehouse: async (id: number): Promise<void> => {
    return axiosInstance.delete(`${INVENTORY_PREFIX}/warehouses/${id}/hard`)
  },

  getInventoryLogs: async (): Promise<InventoryLog[]> => {
    return axiosInstance.get(`${INVENTORY_PREFIX}/logs`)
  },
  
  getLowStockProducts: async (threshold: number = 50): Promise<ProductStockSummary[]> => {
    return axiosInstance.get(`${INVENTORY_PREFIX}/low-stock?threshold=${threshold}`)
  },

  getStocksBulk: async (productIds: number[]): Promise<Record<number, number>> => {
    return axiosInstance.post(`${INVENTORY_PREFIX}/products/stocks`, productIds)
  }
}
