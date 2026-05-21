import axiosInstance from "@/lib/axiosInstance";
import { PrescriptionResponse, PrescriptionStatus } from "@/lib/types";

export const prescriptionService = {
  getMyPrescriptions: async (): Promise<PrescriptionResponse[]> => {
    return await axiosInstance.get("/user-service/api/users/prescriptions/me");
  },

  uploadPrescription: async (file: File): Promise<PrescriptionResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return await axiosInstance.post("/user-service/api/users/prescriptions/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getPendingPrescriptions: async (): Promise<PrescriptionResponse[]> => {
    return await axiosInstance.get("/user-service/api/users/prescriptions/pending");
  },

  getAllPrescriptions: async (): Promise<PrescriptionResponse[]> => {
    // Note: This endpoint should be allowed for pharmacists
    return await axiosInstance.get("/user-service/api/users/prescriptions/all");
  },

  getPrescriptionById: async (id: number): Promise<PrescriptionResponse> => {
    return await axiosInstance.get(`/user-service/api/users/prescriptions/${id}`);
  },

  updatePrescriptionStatus: async (id: number, status: PrescriptionStatus, note?: string): Promise<PrescriptionResponse> => {
    return await axiosInstance.put(`/user-service/api/users/prescriptions/${id}/status`, null, {
      params: { status, note }
    });
  },

  analyzePrescription: async (id: number): Promise<PrescriptionResponse> => {
    return await axiosInstance.post(`/user-service/api/users/prescriptions/${id}/analyze`);
  },

  deletePrescription: async (id: number): Promise<void> => {
    return await axiosInstance.delete(`/user-service/api/users/prescriptions/${id}`);
  },
  
  updatePrescriptionInfo: async (id: number, info: { hospitalName?: string, doctorName?: string, expiryDate?: string }): Promise<PrescriptionResponse> => {
    return await axiosInstance.put(`/user-service/api/users/prescriptions/${id}/info`, null, {
      params: info
    });
  },

  updateExtractedData: async (id: number, extractedData: string): Promise<PrescriptionResponse> => {
    return await axiosInstance.post(`/user-service/api/users/prescriptions/${id}/update-extracted-data`, extractedData, {
      headers: { 'Content-Type': 'text/plain' }
    });
  },

  validateMedicineForCart: async (id: number, productId: number): Promise<void> => {
    await axiosInstance.get(`/user-service/api/users/prescriptions/${id}/validate`, {
      params: { productId }
    });
  }
};
