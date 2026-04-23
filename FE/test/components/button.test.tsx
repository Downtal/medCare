import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

describe('Button Component', () => {
  it('renders correctly with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when the disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByText('Disabled Button')
    expect(button).toBeDisabled()
  })

  it('applies the correct variant classes', () => {
    render(<Button variant="destructive">Destructive</Button>)
    const button = screen.getByText('Destructive')
    expect(button).toHaveClass('bg-destructive')
  })
})
