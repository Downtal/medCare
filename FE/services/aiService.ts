import { getApiBaseUrl, API_ENDPOINTS } from "@/lib/config"

export interface IndexedProduct {
  id: number
  name: string
  symptoms: string
  content: string
  updated_at: string
}

export interface ChatLog {
  id: number
  user_id: number | null
  session_id: string
  user_message: string
  bot_response: string
  detected_symptoms: string[] | null
  suggested_medicines: any[] | null
  rating: boolean | null
  feedback_reason: string | null
  created_at: string
}

export const aiService = {
  async getIndexedProducts(token?: string): Promise<IndexedProduct[]> {
    // console.log("Fetching indexed products from:", `${getApiBaseUrl()}${API_ENDPOINTS.AI}/admin/products`);
    const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.AI}/admin/products`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    })
    if (!response.ok) {
      console.error("Failed to fetch products. Status:", response.status);
      throw new Error("Failed to fetch indexed products")
    }
    const data = await response.json();
    // console.log("Indexed products received:", data.length);
    return data;
  },

  async getChatLogs(token?: string): Promise<ChatLog[]> {
    // console.log("Fetching chat logs from:", `${getApiBaseUrl()}${API_ENDPOINTS.AI}/admin/logs`);
    const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.AI}/admin/logs`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    })
    if (!response.ok) {
      console.error("Failed to fetch logs. Status:", response.status);
      throw new Error("Failed to fetch chat logs")
    }
    const data = await response.json();
    // console.log("Chat logs received:", data.length);
    return data;
  },

  async syncProducts(token?: string): Promise<{ success: boolean; count: number; error?: string }> {
    const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.AI}/admin/sync-products`, {
      method: "POST",
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    })
    if (!response.ok) throw new Error("Failed to sync products")
    return response.json()
  },

  async updateProductSymptoms(id: number, symptoms: string, token?: string): Promise<{ success: boolean }> {
    const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.AI}/admin/products/${id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ symptoms })
    })
    if (!response.ok) throw new Error("Failed to update symptoms")
    return response.json()
  },

  async extractMedicinesFromText(text: string, token?: string): Promise<any> {
    const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.AI}/prescriptions/extract-medicines`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ text })
    })
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("AI Service Raw Error:", errorText);
      
      if (response.status === 429 || errorText.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("Hệ thống AI hiện đang quá tải hoặc hết lượt sử dụng miễn phí hôm nay. Vui lòng thử lại sau vài phút hoặc quay lại vào ngày mai.");
      }

      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || "Failed to extract medicines");
      } catch (e) {
        if (e instanceof Error && e.message.includes("Hệ thống AI")) throw e;
        throw new Error(`Server Error: ${errorText.substring(0, 100)}`);
      }
    }
    return response.json()
  }
}
