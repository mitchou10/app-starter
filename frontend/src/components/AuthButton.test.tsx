import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { AuthButton } from './AuthButton'

const ada = { user_id: '1', email: 'ada@example.com', name: 'Ada', username: 'ada', roles: [], groups: [], is_admin: false }

function stubFetch(handler: (url: string, init?: RequestInit) => unknown) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => handler(url, init)))
}

function stubLocation() {
  const location = { href: '' }
  vi.stubGlobal('location', location)
  return location
}

it('offers to sign in when nobody is logged in', async () => {
  stubFetch(() => ({ ok: false, json: async () => ({}) }))
  renderWithProviders(<AuthButton />)
  expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
})

it('treats an unreachable backend as logged out', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  renderWithProviders(<AuthButton />)
  expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
})

it('sends the browser to the backend to sign in', async () => {
  const location = stubLocation()
  stubFetch(() => ({ ok: false, json: async () => ({}) }))
  renderWithProviders(<AuthButton />)
  await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }))
  expect(location.href).toBe('/api/auth/login?redirect=%2F')
})

it('shows the logged-in user', async () => {
  stubFetch(() => ({ ok: true, json: async () => ada }))
  renderWithProviders(<AuthButton />)
  expect(await screen.findByText('Ada')).toBeInTheDocument()
})

it('signs out and follows the provider logout url', async () => {
  const location = stubLocation()
  stubFetch((url) => ({ ok: true, json: async () => (url === '/api/auth/me' ? ada : { logout_url: 'https://idp/logout' }) }))
  renderWithProviders(<AuthButton />)
  await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }))
  expect(location.href).toBe('https://idp/logout')
  expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
})

it('signs out locally when the provider has no logout url', async () => {
  const location = stubLocation()
  stubFetch((url) => ({ ok: true, json: async () => (url === '/api/auth/me' ? ada : { logout_url: null }) }))
  renderWithProviders(<AuthButton />)
  await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }))
  expect(location.href).toBe('/')
})
