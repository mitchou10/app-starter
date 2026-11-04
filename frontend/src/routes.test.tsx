import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ada, renderApp, stubBackend } from '@/test/render'

it('shows the landing page at /', async () => {
  stubBackend(null)
  renderApp('/')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Build your next app on solid ground')
  expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
})

it('shares the header and footer between pages', async () => {
  stubBackend(null)
  renderApp('/nowhere')
  expect(screen.getByRole('link', { name: 'App' })).toHaveAttribute('href', '/')
  expect(screen.getByText(/All rights reserved/)).toBeInTheDocument()
  await screen.findByRole('button', { name: 'Sign in' })
})

it('shows a 404 page for an unknown address, with a way back', async () => {
  stubBackend(null)
  const router = renderApp('/nowhere')
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('link', { name: 'Back to home' }))
  expect(router.state.location.pathname).toBe('/')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Build your next app')
})

it('asks to sign in on a protected page and brings the visitor back to it', async () => {
  const location = { href: '' }
  vi.stubGlobal('location', location)
  stubBackend(null)
  renderApp('/account?tab=1')
  expect(await screen.findByText('You need to sign in to see this page.')).toBeInTheDocument()
  const buttons = screen.getAllByRole('button', { name: 'Sign in' })
  await userEvent.click(buttons[buttons.length - 1])
  expect(location.href).toBe('/api/auth/login?redirect=%2Faccount%3Ftab%3D1')
})

it('shows the protected page to a logged-in user', async () => {
  stubBackend(ada)
  renderApp('/account')
  expect(await screen.findByRole('heading', { name: 'My account' })).toBeInTheDocument()
  expect(screen.getByText('ada@example.com')).toBeInTheDocument()
  expect(screen.getByText('admin')).toBeInTheDocument()
})

it('asks the backend who is logged in only once for the whole app', async () => {
  stubBackend(ada)
  renderApp('/account')
  await screen.findByRole('heading', { name: 'My account' })
  const calls = vi.mocked(fetch).mock.calls.filter(([url]) => url === '/api/auth/me')
  expect(calls).toHaveLength(1)
})

it('scrolls to a section of the landing page from the header', async () => {
  stubBackend(null)
  const scrollIntoView = vi.fn()
  Element.prototype.scrollIntoView = scrollIntoView
  renderApp('/nowhere')
  await userEvent.click(screen.getByRole('link', { name: 'Features' }))
  expect(scrollIntoView).toHaveBeenCalled()
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Build your next app')
})

it('is translated when the language changes', async () => {
  stubBackend(null)
  renderApp('/')
  await userEvent.click(screen.getByRole('combobox', { name: 'Language' }))
  await userEvent.click(await screen.findByRole('option', { name: 'Français' }))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Construisez votre prochaine application')
  expect(await screen.findByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
})
