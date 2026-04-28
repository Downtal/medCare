import axiosInstance from "@/lib/axiosInstance";
import { PrescriptionResponse, PrescriptionStatus } from "@/lib/types";

export const prescriptionService = {
  getPendingPrescriptions: async (): Promise<PrescriptionResponse[]> => {
    const response = await axiosInstance.get("/api/users/prescriptions/pending");
    return response.data;
  },

  getAllPrescriptions: async (): Promise<PrescriptionResponse[]> => {
    // Note: This endpoint should be allowed for pharmacists
    const response = await axiosInstance.get("/api/users/prescriptions/all");
    return response.data;
  },

  updatePrescriptionStatus: async (id: number, status: PrescriptionStatus, note?: string): Promise<PrescriptionResponse> => {
    const response = await axiosInstance.put(`/api/users/prescriptions/${id}/status`, null, {
      params: { status, note }
    });
    return response.data;
  },

  analyzePrescription: async (id: number): Promise<PrescriptionResponse> => {
    const response = await axiosInstance.post(`/api/users/prescriptions/${id}/analyze`);
    return response.data;
  }
};
