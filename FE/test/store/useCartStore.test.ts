import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCartStore } from '../../lib/store/useCartStore'

// Helper to reset Zustand store between tests since it's a singleton
const resetStore = () => {
  useCartStore.setState({
    items: [],
    totalAmount: 0,
    isLoading: false,
    error: null,
    isGuestCart: true,
  })
}

describe('useCartStore State Machine & Merging Logic', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('initializes with default values', () => {
    const state = useCartStore.getState()
    expect(state.items).toEqual([])
    expect(state.totalAmount).toBe(0)
    expect(state.isGuestCart).toBe(true)
  })

  it('keeps isGuestCart as true when adding item without token', async () => {
    const item = {
      medicineId: 1,
      name: 'Panadol',
      slug: 'panadol',
      imageUrl: '/panadol.png',
      quantity: 1,
      unit: 'Hộp',
      unitPrice: 10000,
      totalPrice: 10000,
    }

    await useCartStore.getState().addItem(item)
    
    const state = useCartStore.getState()
    expect(state.items.length).toBe(1)
    expect(state.items[0].quantity).toBe(1)
    expect(state.isGuestCart).toBe(true)
  })

  it('sets isGuestCart to false when adding item with token', async () => {
    const item = {
      medicineId: 1,
      name: 'Panadol',
      slug: 'panadol',
      imageUrl: '/panadol.png',
      quantity: 1,
      unit: 'Hộp',
      unitPrice: 10000,
      totalPrice: 10000,
    }

    // Mock fetch for background sync
    const fetchSpy = vi.spyOn(global, 'fetch')

    await useCartStore.getState().addItem(item, 'mock-token')
    
    const state = useCartStore.getState()
    expect(state.items.length).toBe(1)
    expect(state.isGuestCart).toBe(false)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('skips merging if isGuestCart is false (cached user cart)', async () => {
    const item = {
      medicineId: 1,
      name: 'Panadol',
      slug: 'panadol',
      imageUrl: '/panadol.png',
      quantity: 2,
      unit: 'Hộp',
      unitPrice: 10000,
      totalPrice: 20000,
    }

    // Set store as if it was already initialized for a logged-in user
    useCartStore.setState({
      items: [item],
      totalAmount: 20000,
      isGuestCart: false,
    })

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [item], totalAmount: 20000 }),
      } as any)
    )

    await useCartStore.getState().mergeCart('mock-token')

    // Should only call initializeCart (which makes 1 GET request to /me),
    // and should NOT call POST /me/items since it is already marked as user cart
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    
    const callArg = fetchSpy.mock.calls[0];
    expect(callArg[0]).toContain('/me')
    // Method should default to GET (as fetchWithAuth receives empty options or defaults to GET)
    expect(callArg[1]?.method).toBeUndefined()
  })

  it('performs merge (POSTs local items) if isGuestCart is true', async () => {
    const item = {
      medicineId: 1,
      name: 'Panadol',
      slug: 'panadol',
      imageUrl: '/panadol.png',
      quantity: 2,
      unit: 'Hộp',
      unitPrice: 10000,
      totalPrice: 20000,
    }

    // Cart contains guest items
    useCartStore.setState({
      items: [item],
      totalAmount: 20000,
      isGuestCart: true,
    })

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url.toString().endsWith('/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [item], totalAmount: 20000 }),
        } as any)
      }
      return Promise.resolve({ ok: true } as any)
    })

    await useCartStore.getState().mergeCart('mock-token')

    // Should call POST /me/items to upload guest items (1 call),
    // then call GET /me to initialize/refresh the user cart (1 call) -> total 2 calls
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    const postCall = fetchSpy.mock.calls.find(c => c[0].toString().endsWith('/items'))
    const getCall = fetchSpy.mock.calls.find(c => c[0].toString().endsWith('/me'))

    expect(postCall).toBeDefined()
    expect(postCall![1]?.method).toBe('POST')
    expect(JSON.parse(postCall![1]?.body)).toEqual({ medicineId: 1, quantity: 2 })

    expect(getCall).toBeDefined()
    
    const state = useCartStore.getState()
    expect(state.isGuestCart).toBe(false)
  })

  it('clears cart and resets isGuestCart on logout (initializeCart without token when was user)', async () => {
    const item = {
      medicineId: 1,
      name: 'Panadol',
      slug: 'panadol',
      imageUrl: '/panadol.png',
      quantity: 2,
      unit: 'Hộp',
      unitPrice: 10000,
      totalPrice: 20000,
    }

    // Set up store as user-owned
    useCartStore.setState({
      items: [item],
      totalAmount: 20000,
      isGuestCart: false,
    })

    await useCartStore.getState().initializeCart(undefined) // Called on logout

    const state = useCartStore.getState()
    expect(state.items).toEqual([])
    expect(state.totalAmount).toBe(0)
    expect(state.isGuestCart).toBe(true)
  })
})
