import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/footer'
import { describe, it, expect } from 'vitest'
import React from 'react'

describe('Footer Component', () => {
  it('renders company name MedCare', () => {
    render(<Footer />)
    expect(screen.getByText('MedCare')).toBeInTheDocument()
  })

  it('contains contact information', () => {
    render(<Footer />)
    expect(screen.getByText('1900 1234')).toBeInTheDocument()
    expect(screen.getByText('support@medcare.vn')).toBeInTheDocument()
  })

  it('contains quick links', () => {
    render(<Footer />)
    expect(screen.getByText('Giới thiệu')).toBeInTheDocument()
    expect(screen.getByText('Liên hệ')).toBeInTheDocument()
  })

  it('contains certification info', () => {
    render(<Footer />)
    expect(screen.getByText('Chứng nhận GPP/GDP')).toBeInTheDocument()
  })
})
