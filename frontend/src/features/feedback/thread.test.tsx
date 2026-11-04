import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { FeedbackThread } from './components/FeedbackThread'
import { FeedbackProvider } from './FeedbackProvider'
import type { FeedbackMessage } from './types'
import { AuthProvider } from '@/auth/AuthProvider'
import { ada, stubBackend } from '@/test/render'

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
const many = (count: number) => Array.from({ length: count }, (_, i) => message(i + 1))

function renderThread(messages: FeedbackMessage[], pageSize?: number) {
  stubBackend(ada)
  const ui = (list: FeedbackMessage[]) => (
    <AuthProvider>
      <FeedbackProvider>
        <FeedbackThread messages={list} pageSize={pageSize} />
      </FeedbackProvider>
    </AuthProvider>
  )
  const view = render(ui(messages))
  return { ...view, update: (list: FeedbackMessage[]) => view.rerender(ui(list)) }
}

it('says so when there is no answer yet', () => {
  renderThread([])
  expect(screen.getByText('No answer yet.')).toBeInTheDocument()
})

it('shows everything when it fits in one page, with no button to load more', () => {
  renderThread(many(4), 10)
  expect(within(screen.getByRole('log')).getAllByRole('listitem')).toHaveLength(4)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

it('opens on the latest message: the box is scrolled to the bottom', () => {
  renderThread(many(30), 10)
  expect(screen.getByRole('log').scrollTop).toBe(1000)
  expect(screen.getByText('message 30')).toBeInTheDocument()
  expect(screen.queryByText('message 20')).not.toBeInTheDocument()
})

it('pages the older messages in from the top, one page at a time', async () => {
  renderThread(many(25), 10)
  expect(screen.getByRole('button', { name: 'Show 10 older messages (15 hidden)' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /Show 10 older/ }))
  expect(screen.getByText('message 6')).toBeInTheDocument()
  expect(screen.queryByText('message 5')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Show 5 older messages (5 hidden)' }))
  expect(screen.getByText('message 1')).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

it('keeps the reader where they were when older messages are added above', async () => {
  renderThread(many(25), 10)
  const log = screen.getByRole('log')
  expect(log.scrollTop).toBe(1000) // 10 messages shown
  await userEvent.click(screen.getByRole('button', { name: /Show 10 older/ }))
  // 10 more messages above (+1000px): the scroll moves by as much, so what was on screen has not moved
  expect(log.scrollTop).toBe(2000)
})

it('goes back to the latest message when a new one arrives', () => {
  const { update } = renderThread(many(5), 10)
  const log = screen.getByRole('log')
  expect(log.scrollTop).toBe(500)
  log.scrollTop = 100 // the reader had scrolled up
  act(() => update(many(6)))
  expect(log.scrollTop).toBe(600)
  expect(screen.getByText('message 6')).toBeInTheDocument()
})
