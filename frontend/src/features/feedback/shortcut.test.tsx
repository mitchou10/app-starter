import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { bob, renderApp, stubBackend } from '@/test/render'
import { isFeedbackShortcut, shortcutLabel } from './shortcut'

afterEach(() => vi.unstubAllGlobals())

async function open(path: string) {
  stubBackend(bob)
  const router = renderApp(path)
  await screen.findByRole('button', { name: 'Open the user menu' })
  return router
}

const press = (keys: string) => userEvent.keyboard(keys)

// ---- the shortcut

it.each(['/app', '/settings', '/feedback/fb-2', '/feedback'])('opens "Give feedback" from %s with Ctrl+Shift+F', async (path) => {
  await open(path)
  await press('{Control>}{Shift>}F{/Shift}{/Control}')
  expect(await screen.findByRole('dialog', { name: 'Give feedback' })).toBeInTheDocument()
})

it('also works with the Command key, for a Mac', async () => {
  await open('/app')
  await press('{Meta>}{Shift>}F{/Shift}{/Meta}')
  expect(await screen.findByRole('dialog', { name: 'Give feedback' })).toBeInTheDocument()
})

it('does not take plain Ctrl+F, which is the browser search, nor Shift+F alone', async () => {
  await open('/app')
  const event = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true })
  document.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
  await press('{Shift>}F{/Shift}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('claims the shortcut from the browser when it uses it', async () => {
  await open('/app')
  const event = new KeyboardEvent('keydown', { key: 'F', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true })
  document.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
})

it('closes with Escape and can be opened again', async () => {
  await open('/app')
  await press('{Control>}{Shift>}F{/Shift}{/Control}')
  await screen.findByRole('dialog')
  await press('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await press('{Control>}{Shift>}F{/Shift}{/Control}')
  expect(await screen.findByRole('dialog')).toBeInTheDocument()
})

it('does not stack a second modal when pressed again while one is open', async () => {
  await open('/app')
  await press('{Control>}{Shift>}F{/Shift}{/Control}')
  await screen.findByRole('dialog')
  await press('{Control>}{Shift>}F{/Shift}{/Control}')
  expect(screen.getAllByRole('dialog')).toHaveLength(1)
})

it('can be used while typing in a field of the page', async () => {
  await open('/feedback/fb-2')
  await userEvent.type(screen.getByRole('textbox', { name: 'Your answer' }), 'hello')
  await press('{Control>}{Shift>}F{/Shift}{/Control}')
  expect(await screen.findByRole('dialog', { name: 'Give feedback' })).toBeInTheDocument()
})

it('is shown in the profile menu, and described to screen readers', async () => {
  await open('/app')
  await userEvent.click(screen.getByRole('button', { name: 'Open the user menu' }))
  const item = await screen.findByRole('menuitem', { name: /Give feedback/ })
  expect(within(item).getByText(shortcutLabel())).toBeInTheDocument()
  expect(item).toHaveAttribute('aria-keyshortcuts', expect.stringContaining('Control+Shift+F'))
})

it('is written for the platform', () => {
  vi.stubGlobal('navigator', { platform: 'MacIntel' })
  expect(shortcutLabel()).toBe('⌘⇧F')
  vi.stubGlobal('navigator', { platform: 'Linux x86_64' })
  expect(shortcutLabel()).toBe('Ctrl+Shift+F')
})

it('recognises only Ctrl or Command with Shift and F', () => {
  const key = (init: KeyboardEventInit) => isFeedbackShortcut(new KeyboardEvent('keydown', init))
  expect(key({ key: 'F', ctrlKey: true, shiftKey: true })).toBe(true)
  expect(key({ key: 'f', metaKey: true, shiftKey: true })).toBe(true)
  expect(key({ key: 'F', shiftKey: true })).toBe(false)
  expect(key({ key: 'F', ctrlKey: true, shiftKey: true, altKey: true })).toBe(false)
  expect(key({ key: 'G', ctrlKey: true, shiftKey: true })).toBe(false)
})

// ---- the page the user was on

async function fillAndSend(dialog: HTMLElement) {
  await userEvent.type(within(dialog).getByLabelText('Title'), 'Looks off here')
  await userEvent.type(within(dialog).getByLabelText('Description'), 'The button is cut.')
  await userEvent.click(within(dialog).getByRole('combobox', { name: 'Type' }))
  await userEvent.click(await screen.findByRole('option', { name: 'Bug' }))
}

it('remembers the page the modal was opened from, and offers to attach it', async () => {
  await open('/settings?tab=1')
  await press('{Control>}{Shift>}F{/Shift}{/Control}')
  const dialog = await screen.findByRole('dialog')
  const attach = within(dialog).getByRole('checkbox', { name: /Attach the page I am on/ })
  expect(attach).toBeChecked()
  expect(within(dialog).getByText('/settings?tab=1')).toBeInTheDocument()

  await fillAndSend(dialog)
  await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }))

  // the sent feedback shows where it came from, as a link back to that page
  const link = await screen.findByRole('link', { name: '/settings?tab=1' })
  expect(link).toHaveAttribute('href', '/settings?tab=1')
})

it('takes the page at the moment the modal opens, not where the user is after', async () => {
  const router = await open('/app')
  await press('{Control>}{Shift>}F{/Shift}{/Control}')
  const dialog = await screen.findByRole('dialog')
  await act(() => router.navigate('/feedback')) // the page changes behind the modal
  await fillAndSend(dialog)
  await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }))
  expect(await screen.findByRole('link', { name: '/app' })).toBeInTheDocument()
})

it('does not attach the page when the user unchecks it', async () => {
  await open('/settings')
  await press('{Control>}{Shift>}F{/Shift}{/Control}')
  const dialog = await screen.findByRole('dialog')
  await userEvent.click(within(dialog).getByRole('checkbox', { name: /Attach the page I am on/ }))
  await fillAndSend(dialog)
  await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }))
  await screen.findByRole('heading', { name: 'Looks off here' })
  expect(screen.queryByRole('link', { name: '/settings' })).not.toBeInTheDocument()
  expect(screen.queryByText('Page:')).not.toBeInTheDocument()
})

it('also remembers the page when opened from the profile menu or the New feedback button', async () => {
  await open('/feedback')
  await userEvent.click(screen.getByRole('button', { name: 'New feedback' }))
  const dialog = await screen.findByRole('dialog')
  expect(within(dialog).getByText('/feedback')).toBeInTheDocument()
})

it('shows where an existing feedback was sent from', async () => {
  await open('/feedback/fb-1')
  const link = await screen.findByRole('link', { name: '/settings' })
  expect(link).toHaveAttribute('href', '/settings')
})
