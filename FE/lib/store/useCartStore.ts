import { getApiBaseUrl } from '@/lib/config'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  medicineId: number;
  name: string;
  slug: string;
  imageUrl: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  packingUnit?: string;
  stockQuantity?: number;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  isLoading: boolean;
  error: string | null;
  // Actions
  initializeCart: (token?: string) => Promise<void>;
  addItem: (item: CartItem, token?: string) => Promise<void>;
  updateQuantity: (medicineId: number, quantity: number, token?: string) => Promise<void>;
  removeItem: (medicineId: number, token?: string) => Promise<void>;
  clearCart: (token?: string) => Promise<void>;
  mergeCart: (token: string) => Promise<void>;
}

const API_BASE = `${getApiBaseUrl()}/order-service/api/cart`;

// Helper for Fetch with Credentials & Bearer
const fetchWithAuth = async (url: string, options: any = {}, token?: string) => {
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important for CART_GUEST_ID cookie
  });
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalAmount: 0,
      isLoading: false,
      error: null,

      initializeCart: async (token?: string) => {
        set({ isLoading: true });
        try {
          const res = await fetchWithAuth(`${API_BASE}/me`, {}, token);
          if (res.ok) {
             const data = await res.json();
             set({ items: data.items, totalAmount: data.totalAmount });
          }
        } catch (error) {
          console.error("Failed to sync cart", error);
        } finally {
          set({ isLoading: false });
        }
      },

      addItem: async (item: CartItem, token?: string) => {
        const { items } = get();
        
        // Optimistic update
        const existingItemIndex = items.findIndex((i: CartItem) => i.medicineId === item.medicineId);
        let newItems = [...items];
        
        if (existingItemIndex >= 0) {
          const existingItem = newItems[existingItemIndex];
          existingItem.quantity += item.quantity;
          existingItem.totalPrice = existingItem.unitPrice * existingItem.quantity;
        } else {
          item.totalPrice = item.unitPrice * item.quantity;
          newItems.push(item);
        }
        
        const newTotal = newItems.reduce((sum: number, i: CartItem) => sum + i.totalPrice, 0);
        set({ items: newItems, totalAmount: newTotal });

        // Background sync
        try {
          await fetchWithAuth(`${API_BASE}/me/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              medicineId: item.medicineId,
              quantity: item.quantity
            }),
          }, token);
        } catch (error) {
          console.error("Failed to add item to remote cart", error);
        }
      },

      updateQuantity: async (medicineId: number, quantity: number, token?: string) => {
        const { items } = get();
        
        if (quantity <= 0) {
           return get().removeItem(medicineId, token);
        }

        // Optimistic update
        const newItems = items.map((item: CartItem) => {
           if (item.medicineId === medicineId) {
              return { ...item, quantity, totalPrice: item.unitPrice * quantity };
           }
           return item;
        });
        const newTotal = newItems.reduce((sum: number, i: CartItem) => sum + i.totalPrice, 0);
        set({ items: newItems, totalAmount: newTotal });

        // Background sync
        try {
          await fetchWithAuth(`${API_BASE}/me/items/${medicineId}?quantity=${quantity}`, {
            method: 'PUT'
          }, token);
        } catch (error) {
          console.error("Failed to update item quantity", error);
        }
      },

      removeItem: async (medicineId: number, token?: string) => {
        const { items } = get();
        
        // Optimistic update
        const newItems = items.filter((item: CartItem) => item.medicineId !== medicineId);
        const newTotal = newItems.reduce((sum: number, i: CartItem) => sum + i.totalPrice, 0);
        set({ items: newItems, totalAmount: newTotal });

        // Background sync
        try {
          await fetchWithAuth(`${API_BASE}/me/items/${medicineId}`, {
            method: 'DELETE'
          }, token);
        } catch (error) {
          console.error("Failed to remove item", error);
        }
      },

      clearCart: async (token?: string) => {
        set({ items: [], totalAmount: 0 });
        try {
          await fetchWithAuth(`${API_BASE}/me/clear`, {
            method: 'DELETE'
          }, token);
        } catch (error) {
          console.error("Failed to clear cart", error);
        }
      },

      mergeCart: async (token: string) => {
        try {
          // Both ids managed server-side: guest (cookie) and user (JWT)
          const res = await fetchWithAuth(`${API_BASE}/merge`, { method: 'POST' }, token);
          if (res.ok) {
            await get().initializeCart(token);
          }
        } catch (error) {
           console.error("Failed to merge carts", error);
        }
      }
    }),
    {
      name: 'medcare-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: CartState) => ({ items: state.items, totalAmount: state.totalAmount }),
    }
  )
)
