import axiosInstance from "@/lib/axiosInstance"

const USER_PREFIX = "/user-service/api/users/profiles"

export interface UserProfile {
  userId: number
  email: string
  username?: string
  fullName?: string
  phone?: string 
  role?: string
  status?: string
  dateOfBirth?: string
  createdAt?: string
  deletedAt?: string
}

export const userService = {
  getAllUsers: async (): Promise<UserProfile[]> => {
    return axiosInstance.get(USER_PREFIX)
  },

  getTrashedUsers: async (): Promise<UserProfile[]> => {
    return axiosInstance.get(`${USER_PREFIX}/trash`)
  },
  
  getUserById: async (userId: number): Promise<UserProfile> => {
    return axiosInstance.get(`${USER_PREFIX}/${userId}`)
  },
  
  updateUser: async (userId: number, data: Partial<UserProfile>) => {
    return axiosInstance.put(`${USER_PREFIX}/${userId}`, data)
  },
  
  deleteUser: async (userId: number) => {
    return axiosInstance.delete(`${USER_PREFIX}/${userId}`)
  },

  restoreUser: async (userId: number) => {
    return axiosInstance.post(`${USER_PREFIX}/${userId}/restore`)
  },

  hardDeleteUser: async (userId: number) => {
    return axiosInstance.delete(`${USER_PREFIX}/${userId}/hard`)
  },

  updateRole: async (userId: number, role: string) => {
    return axiosInstance.put(`/auth-service/api/auth/admin/users/${userId}/role?role=${role}`)
  },

  updateStatus: async (userId: number, status: string) => {
    return axiosInstance.put(`/auth-service/api/auth/admin/users/${userId}/status?status=${status}`)
  },
  
  forceLogout: async (userId: number) => {
    return axiosInstance.post(`/auth-service/api/auth/admin/users/${userId}/force-logout`)
  }
}
