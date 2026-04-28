import axios from "axios"
import { getApiBaseUrl } from "./config"

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

import { getSession } from "next-auth/react"

// Request Interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    // Only works client-side, for server-side you'd use auth() directly
    if (typeof window !== "undefined") {
      const session = await getSession()
      const token = session?.user?.accessToken
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        if (process.env.NODE_ENV === 'development') {
          // console.log(`[Axios] Attaching token to ${config.url}`);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[Axios] No token found for ${config.url}. Session status:`, !!session);
        }
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data // Directly return data
  },
  (error) => {
    // Global error handling, e.g. toast notification
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.warn("Unauthorized, redirecting to login...")
      if (typeof window !== "undefined") {
        // window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
