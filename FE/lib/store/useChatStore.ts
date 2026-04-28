import { create } from 'zustand'

interface ChatStore {
  isOpen: boolean
  isMinimized: boolean
  initialMessage: string | null
  openChat: (message?: string) => void
  closeChat: () => void
  setIsMinimized: (min: boolean) => void
  clearInitialMessage: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  isMinimized: false,
  initialMessage: null,
  openChat: (message) => set({ isOpen: true, isMinimized: false, initialMessage: message || null }),
  closeChat: () => set({ isOpen: false }),
  setIsMinimized: (min) => set({ isMinimized: min }),
  clearInitialMessage: () => set({ initialMessage: null }),
}))
