import { QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { stubBackend, testQueryClient } from '@/test/render'
import { FeedbackThread } from './components/FeedbackThread'
import type { FeedbackMessage } from './types'

// jsdom does no layout: a message is 100px tall, so the height of the box follows what is displayed.
const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.querySelectorAll('li').length * 100
    },
  })
})
afterEach(() => {
  if (original) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', original)
  else delete (HTMLElement.prototype as { scrollHeight?: number }).scrollHeight
})

const message = (n: number): FeedbackMessage => ({
  id: `m${n}`,
  kind: 'comment',
  body: `message ${n}`,
  authorUsername: 'grace',
  authorIsStaff: false,
  createdAt: '2026-11-01T10:00:00Z',
  oldStatusId: null,
  newStatusId: null,
  attachments: [],
})
/** The messages `from` to `to`, oldest first. */
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => message(from + i))

type Props = Partial<Parameters<typeof FeedbackThread>[0]>

function renderThread(props: Props) {
  stubBackend(null)
  const client = testQueryClient()
  const ui = (next: Props) => (
    <QueryClientProvider client={client}>
      <FeedbackThread messages={[]} hidden={0} onLoadOlder={() => {}} {...next} />
    </QueryClientProvider>
  )
  const view = render(ui(props))
  return { ...view, update: (next: Props) => view.rerender(ui(next)) }
}

it('says so when there is no answer yet, and while it loads', () => {
  const { update } = renderThread({ messages: [] })
  expect(screen.getByText('No answer yet.')).toBeInTheDocument()
  update({ loading: true })
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  expect(screen.queryByText('No answer yet.')).not.toBeInTheDocument()
  expect(screen.getByRole('log')).toHaveAttribute('aria-busy', 'true')
})

it('shows what it is given, with no button to load more when nothing is hidden', () => {
  renderThread({ messages: range(1, 4), hidden: 0 })
  expect(within(screen.getByRole('log')).getAllByRole('listitem')).toHaveLength(4)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

it('opens on the latest message: the box is scrolled to the bottom', () => {
  renderThread({ messages: range(16, 25), hidden: 15 })
  expect(screen.getByRole('log').scrollTop).toBe(1000)
  expect(screen.getByText('message 25')).toBeInTheDocument()
})

it('offers the next page of older messages, and says how many are hidden', async () => {
  const onLoadOlder = vi.fn()
  const { update } = renderThread({ messages: range(16, 25), hidden: 15, onLoadOlder })
  await userEvent.click(screen.getByRole('button', { name: 'Show 10 older messages (15 hidden)' }))
  expect(onLoadOlder).toHaveBeenCalledOnce()

  update({ messages: range(16, 25), hidden: 5, onLoadOlder })
  expect(screen.getByRole('button', { name: 'Show 5 older messages (5 hidden)' })).toBeInTheDocument()
  update({ messages: range(1, 25), hidden: 0, onLoadOlder })
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

it('cannot be asked twice while the older messages are on their way', () => {
  renderThread({ messages: range(16, 25), hidden: 15, loadingOlder: true })
  expect(screen.getByRole('button', { name: /older messages/ })).toBeDisabled()
})

it('keeps the reader where they were when older messages are added above', async () => {
  const { update } = renderThread({ messages: range(16, 25), hidden: 15 })
  const log = screen.getByRole('log')
  expect(log.scrollTop).toBe(1000) // 10 messages shown
  await userEvent.click(screen.getByRole('button', { name: /Show 10 older/ }))
  update({ messages: range(6, 25), hidden: 5 })
  // 10 more messages above (+1000px): the scroll moves by as much, so what was on screen has not moved
  expect(log.scrollTop).toBe(2000)
})

it('goes back to the latest message when a new one arrives', () => {
  const { update } = renderThread({ messages: range(1, 5) })
  const log = screen.getByRole('log')
  expect(log.scrollTop).toBe(500)
  log.scrollTop = 100 // the reader had scrolled up
  act(() => update({ messages: range(1, 6) }))
  expect(log.scrollTop).toBe(600)
  expect(screen.getByText('message 6')).toBeInTheDocument()
})

it('goes to the bottom once the messages have loaded', () => {
  const { update } = renderThread({ loading: true, messages: [] })
  update({ loading: false, messages: range(1, 8) })
  expect(screen.getByRole('log').scrollTop).toBe(800)
})
