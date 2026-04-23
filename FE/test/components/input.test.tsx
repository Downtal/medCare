import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/input'
import { describe, it, expect } from 'vitest'
import React from 'react'

describe('Input Component', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter name" />)
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument()
  })

  it('handles value changes', () => {
    render(<Input placeholder="Enter name" />)
    const input = screen.getByPlaceholderText('Enter name') as HTMLInputElement
    
    fireEvent.change(input, { target: { value: 'John Doe' } })
    expect(input.value).toBe('John Doe')
  })

  it('is disabled when the disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled input" />)
    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
  })
})
