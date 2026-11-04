import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Section } from './Section'
import { SectionHeading } from './SectionHeading'

it('is a landmark that can be targeted by id and keeps extra classes', () => {
  render(<Section id="about" className="bg-muted" aria-label="About">content</Section>)
  const section = screen.getByRole('region', { name: 'About' })
  expect(section).toHaveAttribute('id', 'about')
  expect(section).toHaveClass('bg-muted', 'py-16')
  expect(section).toHaveTextContent('content')
})

it('shows the heading, and the description only when given', () => {
  const { rerender } = render(<SectionHeading title="Title" description="Details" />)
  expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
  expect(screen.getByText('Details')).toBeInTheDocument()
  rerender(<SectionHeading title="Title" />)
  expect(screen.queryByText('Details')).not.toBeInTheDocument()
})
