import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import type { SeedNotification } from '@/test/fakeNotificationsApi'
import { ada, bob, renderApp, Reply, stubBackend } from '@/test/render'
import { NotificationLink } from './components/NotificationLink'

afterEach(() => vi.useRealTimers())

/** Opens the app at `path` as `user`, with these notifications waiting for them. */
async function open(path: string, seed: SeedNotification[] = [], user: typeof ada | typeof bob = bob) {
  const fake = stubBackend(user, undefined, { notifications: seed })
  const router = renderApp(path)
  await screen.findByRole('button', { name: /Open the user menu/ })
  await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
  return { router, fake }
}

const many = (count: number, extra: Partial<SeedNotification> = {}): SeedNotification[] =>
  Array.from({ length: count }, (_, i) => ({ title: `Notification ${i + 1}`, ...extra }))

const titles = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)

// ---- the page

it('lists my notifications newest first, with who emitted them and what they say', async () => {
  await open('/notifications', [
    { title: 'Invoice ready', source: 'billing', description: 'Your invoice for October is available.' },
    { title: 'Report done', source: 'reports', description: 'The weekly report was built.' },
  ])
  expect(screen.getByRole('heading', { level: 1, name: 'Notifications' })).toBeInTheDocument()
  expect(titles()).toEqual(['Report done', 'Invoice ready']) // the last one emitted is on top
  const item = screen.getByRole('heading', { name: 'Invoice ready' }).closest('li')!
  expect(within(item).getByText('billing')).toBeInTheDocument()
  expect(within(item).getByText('Your invoice for October is available.')).toBeInTheDocument()
  expect(item.querySelector('time')).toHaveAttribute('datetime')
})

it('is the same page for an admin', async () => {
  await open('/notifications', [{ title: 'Invoice ready' }], ada)
  expect(titles()).toEqual(['Invoice ready'])
})

it('says so when there is nothing, and when everything is read', async () => {
  await open('/notifications', [])
  expect(screen.getByText('You have no notifications.')).toBeInTheDocument()
  expect(screen.queryByText(/ of /)).not.toBeInTheDocument()
})

it('tells the unread ones apart', async () => {
  await open('/notifications', [{ title: 'Read one', read: true }, { title: 'New one' }])
  const unread = screen.getByRole('heading', { name: 'New one' }).closest('li')!
  expect(within(unread).getByText('Unread:')).toBeInTheDocument()
  const read = screen.getByRole('heading', { name: 'Read one' }).closest('li')!
  expect(within(read).queryByText('Unread:')).not.toBeInTheDocument()
})

it('asks the server for the unread ones only, and counts them in the tab', async () => {
  await open('/notifications', [{ title: 'Old', read: true }, { title: 'Fresh 1' }, { title: 'Fresh 2' }])
  expect(screen.getByRole('tab', { name: 'Unread (2)' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('tab', { name: 'Unread (2)' }))
  await waitFor(() => expect(titles()).toEqual(['Fresh 2', 'Fresh 1']))
  await userEvent.click(screen.getByRole('tab', { name: 'All' }))
  await waitFor(() => expect(titles()).toHaveLength(3))
})

it('has a message of its own for an empty unread list', async () => {
  await open('/notifications', [{ title: 'Old', read: true }])
  await userEvent.click(screen.getByRole('tab', { name: 'Unread (0)' }))
  expect(await screen.findByText('No unread notifications.')).toBeInTheDocument()
})

it('says so when the list cannot be loaded', async () => {
  stubBackend(bob, (url) => (url.startsWith('/api/notifications?') ? new Reply(500, { detail: 'boom' }) : url.endsWith('unread-count') ? { count: 0 } : undefined))
  renderApp('/notifications')
  expect(await screen.findByText('Something went wrong. Try again.')).toBeInTheDocument()
})

// ---- reading

it('marks one as read, and back to unread, and the counts follow', async () => {
  await open('/notifications', [{ title: 'One' }, { title: 'Two' }])
  expect(screen.getByRole('tab', { name: 'Unread (2)' })).toBeInTheDocument()

  const item = screen.getByRole('heading', { name: 'One' }).closest('li')!
  await userEvent.click(within(item).getByRole('button', { name: 'Mark as read' }))
  await screen.findByRole('tab', { name: 'Unread (1)' })
  expect(within(item).queryByText('Unread:')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Open the user menu, 1 unread notification$/ })).toBeInTheDocument()

  await userEvent.click(within(item).getByRole('button', { name: 'Mark as unread' }))
  await screen.findByRole('tab', { name: 'Unread (2)' })
  expect(within(item).getByText('Unread:')).toBeInTheDocument()
})

it('marks everything as read at once', async () => {
  await open('/notifications', [{ title: 'One' }, { title: 'Two' }, { title: 'Three', read: true }])
  await userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))
  await screen.findByRole('tab', { name: 'Unread (0)' })
  expect(screen.queryByText('Unread:')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled() // nothing left to read
  expect(screen.getByRole('button', { name: 'Open the user menu' })).toBeInTheDocument() // and no dot
})

it('has nothing to mark when there is nothing unread', async () => {
  await open('/notifications', [{ title: 'Old', read: true }])
  expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled()
})

// ---- where a notification leads

it('opens a page of the app, and reads the notification on the way', async () => {
  const { router } = await open('/notifications', [{ title: 'Answer', url: '/feedback/fb-2' }])
  const link = screen.getByRole('link', { name: 'Open' })
  expect(link).toHaveAttribute('href', '/feedback/fb-2')
  expect(link).not.toHaveAttribute('target')
  await userEvent.click(link)
  expect(router.state.location.pathname).toBe('/feedback/fb-2')
  expect(await screen.findByRole('button', { name: 'Open the user menu' })).toBeInTheDocument() // no more unread
})

it('opens another application in a new tab, safely, and reads the notification', async () => {
  const { fake } = await open('/notifications', [{ title: 'Invoice', url: 'https://billing.example.com/invoices/42' }])
  const link = screen.getByRole('link', { name: 'Open on billing.example.com' })
  expect(link).toHaveAttribute('href', 'https://billing.example.com/invoices/42')
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  link.addEventListener('click', (event) => event.preventDefault()) // jsdom does not navigate: the click is what counts
  await userEvent.click(link)
  await waitFor(() => expect(fake.notifications.notifications[0].read).toBe(true))
})

it('does not offer to open anything when there is no link', async () => {
  await open('/notifications', [{ title: 'Just so you know' }])
  expect(screen.queryByRole('link', { name: /Open/ })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Mark as read' })).toBeInTheDocument()
})

it('shows the address itself when it cannot be read as one', () => {
  render(
    <MemoryRouter>
      <NotificationLink url="http://" onOpen={() => {}} />
    </MemoryRouter>,
  )
  expect(screen.getByRole('link', { name: 'Open on http://' })).toBeInTheDocument()
})

// ---- pages

it('shows the list by pages of ten, with how many there are', async () => {
  await open('/notifications', many(12))
  expect(titles()).toHaveLength(10)
  expect(screen.getByText('10 of 12')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Show 2 more' }))
  await waitFor(() => expect(titles()).toHaveLength(12))
  expect(screen.getByText('12 of 12')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Show .* more/ })).not.toBeInTheDocument()
})

// ---- the badge

it('puts a dot on the avatar and a count in the menu when there is something unread', async () => {
  await open('/app', many(3))
  const trigger = screen.getByRole('button', { name: 'Open the user menu, 3 unread notifications' })
  expect(within(trigger).getByText('3 unread notifications')).toBeInTheDocument() // the dot, for screen readers
  expect(trigger.querySelector('[data-slot="avatar-badge"]')).toBeInTheDocument()

  await userEvent.click(trigger)
  const item = await screen.findByRole('menuitem', { name: /Notifications/ })
  expect(item).toHaveAttribute('href', '/notifications')
  expect(within(item).getByText('3')).toBeInTheDocument()
})

it('says "1 notification" in the singular', async () => {
  await open('/app', many(1))
  expect(screen.getByRole('button', { name: 'Open the user menu, 1 unread notification' })).toBeInTheDocument()
})

it('shows no dot and no count when everything is read, but still offers the page', async () => {
  await open('/app', many(2, { read: true }))
  const trigger = screen.getByRole('button', { name: 'Open the user menu' })
  expect(trigger.querySelector('[data-slot="avatar-badge"]')).not.toBeInTheDocument()
  await userEvent.click(trigger)
  const item = await screen.findByRole('menuitem', { name: 'Notifications' }) // no count in its name
  expect(item).toHaveAttribute('href', '/notifications')
})

it('caps the count at 99+', async () => {
  await open('/app', many(120))
  await userEvent.click(screen.getByRole('button', { name: /Open the user menu/ }))
  expect(await screen.findByText('99+')).toBeInTheDocument()
})

it('is in French too, with its plurals', async () => {
  await open('/app', many(1))
  await act(() => i18n.changeLanguage('fr'))
  expect(screen.getByRole('button', { name: 'Ouvrir le menu utilisateur, 1 notification non lue' })).toBeInTheDocument()
  await act(() => i18n.changeLanguage('en')) // the other tests read English
})

it('is on every page of the app, not only on the notifications page', async () => {
  await open('/settings', many(2))
  expect(screen.getByRole('button', { name: 'Open the user menu, 2 unread notifications' })).toBeInTheDocument()
})

it('shows a new notification without a reload: the count is asked again every 30 seconds', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const { fake } = await open('/app', [])
  expect(screen.getByRole('button', { name: 'Open the user menu' })).toBeInTheDocument()

  fake.notifications.emit({ title: 'Just arrived' })
  await act(() => vi.advanceTimersByTimeAsync(31_000))
  expect(await screen.findByRole('button', { name: 'Open the user menu, 1 unread notification' })).toBeInTheDocument()
})

it('does not need a login to fail gracefully: the badge stays off when the count cannot be read', async () => {
  stubBackend(bob, (url) => (url.endsWith('unread-count') ? new Reply(500) : undefined))
  renderApp('/app')
  expect(await screen.findByRole('button', { name: 'Open the user menu' })).toBeInTheDocument()
})
