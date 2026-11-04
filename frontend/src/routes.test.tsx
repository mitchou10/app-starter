import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ada, renderApp, stubBackend } from '@/test/render'

it('shows the landing page at /, with no navigation link in the header', async () => {
  stubBackend(null)
  renderApp('/')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Build your next app on solid ground')
  expect(screen.queryByRole('link', { name: 'Features' })).not.toBeInTheDocument()
  expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
})

it('shares the header and footer between public pages', async () => {
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

it('scrolls to the section named in the address', async () => {
  stubBackend(null)
  const scrollIntoView = vi.fn()
  Element.prototype.scrollIntoView = scrollIntoView
  renderApp('/#features')
  await screen.findByRole('button', { name: 'Sign in' })
  expect(scrollIntoView).toHaveBeenCalled()
})

it('asks to sign in on a page of the app and brings the visitor back to it', async () => {
  const location = { href: '' }
  vi.stubGlobal('location', location)
  stubBackend(null)
  renderApp('/settings?tab=1')
  expect(await screen.findByText('You need to sign in to see this page.')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(location.href).toBe('/api/auth/login?redirect=%2Fsettings%3Ftab%3D1')
})

it('shows the app with its sidebar to a logged-in user', async () => {
  stubBackend(ada)
  renderApp('/app')
  expect(await screen.findByRole('heading', { name: 'Welcome, Ada' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/app')
  expect(screen.getByRole('button', { name: 'Open the user menu' })).toHaveTextContent('ada@example.com')
  // the public header and footer are not part of the app
  expect(screen.queryByText(/All rights reserved/)).not.toBeInTheDocument()
})

it('shows the settings of the logged-in user', async () => {
  stubBackend(ada)
  renderApp('/settings')
  expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  expect(screen.getAllByText('ada@example.com').length).toBeGreaterThan(0)
  expect(screen.getByText('admin')).toBeInTheDocument()
})

it('asks the backend who is logged in only once for the whole app', async () => {
  stubBackend(ada)
  renderApp('/app')
  await screen.findByRole('heading', { name: 'Welcome, Ada' })
  const calls = vi.mocked(fetch).mock.calls.filter(([url]) => url === '/api/auth/me')
  expect(calls).toHaveLength(1)
})

it('is translated when the language changes', async () => {
  stubBackend(null)
  renderApp('/')
  await userEvent.click(screen.getByRole('combobox', { name: 'Language' }))
  await userEvent.click(await screen.findByRole('option', { name: 'Français' }))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Construisez votre prochaine application')
  expect(await screen.findByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
})
