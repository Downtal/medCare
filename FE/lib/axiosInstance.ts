import axios from "axios"
import { getApiBaseUrl } from "./config"

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

import { getSession, signOut } from "next-auth/react"
import { toast } from "sonner"

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
  async (error) => {
    // Global error handling, e.g. toast notification
    if (error.response?.status === 401) {
      const errorCode = error.response.data?.error || error.response.data?.message;
      if (errorCode === "TOKEN_REVOKED" || errorCode === "ACCOUNT_DISABLED") {
        console.warn("Session revoked, clearing state and redirecting to login...");
        if (typeof window !== "undefined") {
          toast.error("Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.", {
            id: "session-expired-toast"
          });
          await signOut({ redirect: true, callbackUrl: "/dang-nhap" });
        }
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
