import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getOptimizedImageUrl(url: string) {
  if (!url || url.includes('placeholder.svg')) return "/placeholder.svg";
  
  // Cloudinary optimization via URL (f_auto, q_auto)
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // Avoid double injecting
    if (url.includes('/f_auto') || url.includes('/q_auto')) return url;
    
    // Insert transformations
    const transform = 'f_auto,q_auto';
    if (url.includes('/upload/v')) {
      return url.replace('/upload/', `/upload/${transform}/`);
    }
    return url.replace('/upload/', `/upload/${transform}/`);
  }
  
  return url;
}
export function formatCurrency(amount: number | bigint) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}
