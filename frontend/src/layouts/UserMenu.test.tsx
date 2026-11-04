import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ada, renderApp, stubBackend } from '@/test/render'

async function openMenu() {
  stubBackend(ada, () => ({ logout_url: null }))
  renderApp('/app')
  await userEvent.click(await screen.findByRole('button', { name: 'Open the user menu' }))
}

it('opens from the profile at the bottom of the sidebar and shows who is logged in', async () => {
  await openMenu()
  expect(await screen.findByRole('menuitem', { name: 'Settings' })).toBeInTheDocument()
  expect(screen.getByRole('menuitem', { name: 'Language' })).toBeInTheDocument()
  expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument()
  expect(screen.getAllByText('ada@example.com').length).toBeGreaterThan(1) // in the button and in the menu
})

it('goes to the settings', async () => {
  await openMenu()
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Settings' }))
  expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
})

it('changes the language', async () => {
  await openMenu()
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Language' }))
  await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Français' }))
  expect(await screen.findByRole('heading', { name: 'Bienvenue, Ada' })).toBeInTheDocument()
})

it('signs out', async () => {
  const location = { href: '' }
  vi.stubGlobal('location', location)
  await openMenu()
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }))
  expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
  await vi.waitFor(() => expect(location.href).toBe('/'))
})
