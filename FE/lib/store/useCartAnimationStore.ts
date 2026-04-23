import { create } from 'zustand'

interface CartAnimation {
  id: string;
  imageUrl: string;
  startX: number;
  startY: number;
}

interface AnimationState {
  animations: CartAnimation[];
  addAnimation: (animation: CartAnimation) => void;
  removeAnimation: (id: string) => void;
}

export const useCartAnimationStore = create<AnimationState>((set) => ({
  animations: [],
  addAnimation: (animation) => set((state) => ({ 
    animations: [...state.animations, animation] 
  })),
  removeAnimation: (id) => set((state) => ({ 
    animations: state.animations.filter((a) => a.id !== id) 
  })),
}))
