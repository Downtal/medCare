import { render, screen, fireEvent } from '@testing-library/react'
import { CartDrawer } from '@/components/cart-drawer'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { useCartStore } from '@/lib/store/useCartStore'

// Mock the store
vi.mock('@/lib/store/useCartStore', () => ({
  useCartStore: vi.fn(),
}))

describe('CartDrawer Component', () => {
  const mockItems = [
    {
      medicineId: 1,
      name: 'Paracetamol',
      slug: 'paracetamol',
      imageUrl: '/para.jpg',
      quantity: 2,
      unit: 'Hộp',
      unitPrice: 50000,
      totalPrice: 100000,
    },
  ]

  const mockUpdateQuantity = vi.fn()
  const mockRemoveItem = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useCartStore as any).mockReturnValue({
      items: mockItems,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    })
  })

  it('renders cart items correctly', () => {
    render(<CartDrawer open={true} onClose={() => {}} />)
    expect(screen.getByText('Paracetamol')).toBeInTheDocument()
    expect(screen.getByText('Giỏ hàng (1)')).toBeInTheDocument()
  })

  it('shows empty message when no items', () => {
    ;(useCartStore as any).mockReturnValue({
      items: [],
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    })
    render(<CartDrawer open={true} onClose={() => {}} />)
    expect(screen.getByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument()
  })

  it('handles quantity increase', () => {
    render(<CartDrawer open={true} onClose={() => {}} />)
    const plusButton = screen.getAllByRole('button').find(b => b.querySelector('svg.lucide-plus'))
    if (plusButton) fireEvent.click(plusButton)
    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 3, undefined)
  })

  it('handles item removal', () => {
    render(<CartDrawer open={true} onClose={() => {}} />)
    const removeButton = screen.getAllByRole('button').find(b => b.querySelector('svg.lucide-trash2'))
    if (removeButton) fireEvent.click(removeButton)
    expect(mockRemoveItem).toHaveBeenCalledWith(1)
  })
})
