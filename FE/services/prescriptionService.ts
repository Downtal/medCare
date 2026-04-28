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
  }
};
