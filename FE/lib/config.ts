/**
 * Configuration for API Base URLs
 * This centralized config helps avoid hardcoding localhost/127.0.0.1 throughout the frontend.
 * It handles the distinction between Client-side (Public) and Server-side (Internal) requests.
 */

export const getApiBaseUrl = (): string => {
  // Use localhost consistently throughout development
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
  }
  
  return process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
}

// Service-specific prefixes if needed (they all currently route through the gateway at 8080)
export const API_ENDPOINTS = {
  PRODUCT: "/product-service/api",
  REVIEW: "/review-service/api",
  ORDER: "/order-service/api",
  AUTH: "/auth-service/api",
  USER: "/user-service/api",
  PROMOTION: "/promotion-service/api",
  SHIPPING: "/shipping-service/api",
  PAYMENT: "/payment-service/api",
  INVENTORY: "/inventory-service/api",
}

export const API_PRODUCT = getApiBaseUrl() + "/product-service/api";
