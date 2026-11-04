import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ada, renderWithProviders, stubBackend } from '@/test/render'
import { AuthButton } from './AuthButton'

it('offers to sign in, and brings the user to the app afterwards', async () => {
  const location = { href: '' }
  vi.stubGlobal('location', location)
  stubBackend(null)
  renderWithProviders(<AuthButton />)
  await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }))
  expect(location.href).toBe('/api/auth/login?redirect=%2Fapp')
})

it('treats an unreachable backend as logged out', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  renderWithProviders(<AuthButton />)
  expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
})

it('links to the app once logged in', async () => {
  stubBackend(ada)
  renderWithProviders(<AuthButton />)
  expect(await screen.findByRole('link', { name: 'Open the app' })).toHaveAttribute('href', '/app')
  expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument()
})
