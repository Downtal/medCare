import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from '@/components/product-card'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { useCartStore } from '@/lib/store/useCartStore'
import { useCartAnimationStore } from '@/lib/store/useCartAnimationStore'

// Mock stores
vi.mock('@/lib/store/useCartStore', () => ({
  useCartStore: vi.fn(),
}))
vi.mock('@/lib/store/useCartAnimationStore', () => ({
  useCartAnimationStore: vi.fn(),
}))

describe('ProductCard Component', () => {
  const mockProps = {
    id: '1',
    name: 'Panadol',
    ingredient: 'Paracetamol',
    price: 30000,
    originalPrice: 35000,
    image: '/panadol.jpg',
    packingUnit: 'Hộp',
  }

  const mockAddItem = vi.fn()
  const mockAddAnimation = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useCartStore as any).mockReturnValue(mockAddItem)
    ;(useCartAnimationStore as any).mockReturnValue(mockAddAnimation)
  })

  it('renders product information correctly', () => {
    render(<ProductCard {...mockProps} />)
    expect(screen.getByText('Panadol')).toBeInTheDocument()
    expect(screen.getByText('30.000đ')).toBeInTheDocument()
  })

  it('handles adding to cart', () => {
    render(<ProductCard {...mockProps} />)
    const addButton = screen.getByText('Thêm vào giỏ')
    fireEvent.click(addButton)
    
    expect(mockAddItem).toHaveBeenCalled()
    expect(mockAddAnimation).toHaveBeenCalled()
  })

  it('shows prescription badge for prescription drugs', () => {
    render(<ProductCard {...mockProps} requiresPrescription={true} />)
    expect(screen.getByText('Thuốc kê đơn')).toBeInTheDocument()
    expect(screen.queryByText('Thêm vào giỏ')).not.toBeInTheDocument()
  })

  it('shows out of stock badge when stock is 0', () => {
    render(<ProductCard {...mockProps} stockQuantity={0} />)
    expect(screen.getByText('HẾT HÀNG')).toBeInTheDocument()
    const addButton = screen.getByText('Hết hàng')
    expect(addButton).toBeDisabled()
  })
})
