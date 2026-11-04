import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, it, vi } from 'vitest'
import { ada, bob, Reply, stubBackend, testQueryClient } from '@/test/render'
import { api, ApiError } from './client'
import { useCreateFeedback } from './create'
import { useChangeFeedback, useFeedbackDetail } from './detail'
import { errorKind } from './errors'
import { useFeedbackList } from './list'
import { toFeedback, toMessage, toStatus, toSummary } from './mappers'
import { useArchiveReference, useReferences, useSaveReference } from './references'
import { refreshNewest, useReply, useThread } from './thread'
import type { WireMessagesPage } from './wire'

function setup(user = ada) {
  const fake = stubBackend(user)
  const client = testQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  return { fake, client, wrapper }
}

const NO_FILTER = { status: 'all', type: 'all' }

// ---- the client

it('returns the JSON answer, sends JSON as JSON and a form as a form', async () => {
  stubBackend(ada, () => ({ ok: true }))
  expect(await api('/x')).toEqual({ ok: true })
  await api('/x', { method: 'POST', json: { a: 1 } })
  const [, init] = vi.mocked(fetch).mock.calls.at(-1)!
  expect(init?.body).toBe('{"a":1}')
  expect(init?.headers).toMatchObject({ 'content-type': 'application/json' })

  const form = new FormData()
  await api('/x', { method: 'POST', form })
  const [, sent] = vi.mocked(fetch).mock.calls.at(-1)!
  expect(sent?.body).toBe(form)
  expect(sent?.headers).toBeUndefined() // the browser sets the content type and its boundary
})

it('throws what the backend said when it does not say yes', async () => {
  stubBackend(ada, () => new Reply(409, { detail: 'A value with this name already exists' }))
  const error = await api('/x').catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ApiError)
  expect(error).toMatchObject({ status: 409, message: 'A value with this name already exists' })
})

it('falls back on the status text when the detail is not a sentence', async () => {
  stubBackend(ada, () => new Reply(422, { detail: [{ loc: ['body', 'title'], msg: 'Field required' }] }))
  expect(await api('/x').catch((e: unknown) => e)).toMatchObject({ status: 422, message: '422' })
})

it('answers undefined to a 204', async () => {
  stubBackend(ada, () => new Reply(204))
  expect(await api('/x', { method: 'DELETE' })).toBeUndefined()
})

it('names what went wrong for the screen', () => {
  const kind = (status: number, message = '') => errorKind(new ApiError(status, message))
  expect(kind(403)).toBe('forbidden')
  expect(kind(404)).toBe('notFound')
  expect(kind(409)).toBe('duplicate')
  expect(kind(413)).toBe('tooLarge')
  expect(kind(415)).toBe('unsupported')
  expect(kind(422, 'Too many screenshots')).toBe('tooMany')
  expect(kind(422, 'The message is empty')).toBe('invalid')
  expect(kind(500)).toBe('failed')
  expect(errorKind(new TypeError('Failed to fetch'))).toBe('network')
})

// ---- the mappers

it('turns what the backend sends into what the screens use', () => {
  const attachment = { id: 'a', filename: 'f.png', content_type: 'image/png', size_bytes: 9, url: '/u' }
  expect(
    toFeedback({
      id: '1', title: 't', description: 'd', type_id: 'ty', status_id: 'st', created_by: 'u', created_by_username: 'ada',
      page: '/p', created_at: 'c', updated_at: 'u2', attachments: [attachment],
    }),
  ).toMatchObject({ typeId: 'ty', statusId: 'st', createdByUsername: 'ada', page: '/p', attachments: [{ contentType: 'image/png', sizeBytes: 9 }] })
  expect(toSummary({ id: '1', title: 't', type_id: 'ty', status_id: 'st', created_by: 'u', created_by_username: 'a', created_at: 'c', updated_at: 'u', replies_count: 3 }).repliesCount).toBe(3)
  expect(toMessage({ id: 'm', kind: 'status_change', body: '', author_username: 'g', author_is_staff: true, created_at: 'c', old_status_id: 'a', new_status_id: 'b', attachments: [] })).toMatchObject({ authorIsStaff: true, oldStatusId: 'a', newStatusId: 'b' })
  expect(toStatus({ id: 's', name: 'Done', description: '', tone: 'green', position: 5, created_by: null, created_by_username: null, created_at: 'c', archived: false, key: 'done', is_closed: true })).toMatchObject({ key: 'done', isClosed: true })
})

// ---- types and statuses

it('loads the types and the statuses', async () => {
  const { wrapper } = setup()
  const { result } = renderHook(() => useReferences(), { wrapper })
  expect(result.current.ready).toBe(false)
  await waitFor(() => expect(result.current.ready).toBe(true))
  expect(result.current.types.map((t) => t.name)).toEqual(['Bug', 'Suggestion', 'Question', 'Other'])
  expect(result.current.statuses.find((s) => s.key === 'closed')?.isClosed).toBe(true)
})

it('adds, edits and archives a value, and reloads the list', async () => {
  const { wrapper } = setup()
  const references = renderHook(() => useReferences(), { wrapper })
  const save = renderHook(() => useSaveReference('type'), { wrapper })
  const archive = renderHook(() => useArchiveReference('type'), { wrapper })
  await waitFor(() => expect(references.result.current.ready).toBe(true))

  await act(() => save.result.current.mutateAsync({ input: { name: 'Praise', description: 'Nice', tone: 'green' } }))
  await waitFor(() => expect(references.result.current.types.map((t) => t.name)).toContain('Praise'))
  const praise = references.result.current.types.find((t) => t.name === 'Praise')!
  expect(praise).toMatchObject({ createdByUsername: 'ada', tone: 'green' })

  await act(() => save.result.current.mutateAsync({ id: praise.id, input: { name: 'Kudos', description: 'Nice', tone: 'green' } }))
  await waitFor(() => expect(references.result.current.types.map((t) => t.name)).toContain('Kudos'))
  await act(() => archive.result.current.mutateAsync({ id: praise.id, archived: true }))
  await waitFor(() => expect(references.result.current.types.find((t) => t.id === praise.id)?.archived).toBe(true))
})

it('sends is_closed for a status and refuses a name that is taken', async () => {
  const { wrapper, fake } = setup()
  const save = renderHook(() => useSaveReference('status'), { wrapper })
  await act(() => save.result.current.mutateAsync({ input: { name: 'Merged', description: '', tone: 'gray', isClosed: true } }))
  expect(fake.statuses.find((s) => s.name === 'Merged')).toMatchObject({ is_closed: true })
  await expect(save.result.current.mutateAsync({ input: { name: 'done', description: '', tone: 'gray' } })).rejects.toMatchObject({ status: 409 })
})

// ---- the list

it('reads the list a page at a time, with the total', async () => {
  const { wrapper } = setup()
  const { result } = renderHook(() => useFeedbackList('mine', NO_FILTER), { wrapper })
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.items).toHaveLength(10))
  expect(result.current.total).toBe(12)
  expect(result.current.hasMore).toBe(true)
  expect(result.current.items[0].title).toBe('The save button does nothing on the settings page')
  expect(result.current.items[0].repliesCount).toBe(17)

  act(() => result.current.loadMore())
  await waitFor(() => expect(result.current.items).toHaveLength(12))
  expect(result.current.hasMore).toBe(false)
})

it('filters on the server, by status and by type', async () => {
  const { wrapper } = setup()
  const open = renderHook(() => useFeedbackList('mine', { status: 'open', type: 'all' }), { wrapper })
  await waitFor(() => expect(open.result.current.isLoading).toBe(false))
  expect(open.result.current.items.map((i) => i.statusId)).not.toContain('done')
  const bugs = renderHook(() => useFeedbackList('mine', { status: 'all', type: 'bug' }), { wrapper })
  await waitFor(() => expect(bugs.result.current.isLoading).toBe(false))
  expect(bugs.result.current.items.map((i) => i.typeId)).toEqual(['bug'])
})

it('lets an admin read everybody’s feedback, and tells a user no', async () => {
  const admin = setup(ada)
  const all = renderHook(() => useFeedbackList('all', NO_FILTER), { wrapper: admin.wrapper })
  await waitFor(() => expect(all.result.current.total).toBeGreaterThan(30))
  const user = setup(bob)
  const refused = renderHook(() => useFeedbackList('all', NO_FILTER), { wrapper: user.wrapper })
  await waitFor(() => expect(refused.result.current.isError).toBe(true))
})

// ---- one feedback

it('reads one feedback, and a feedback that is not yours is an error', async () => {
  const { wrapper } = setup(bob)
  const mine = renderHook(() => useFeedbackDetail('fb-1'), { wrapper })
  await waitFor(() => expect(mine.result.current.data?.title).toMatch(/save button/))
  expect(mine.result.current.data?.page).toBe('/settings')
  const other = renderHook(() => useFeedbackDetail('fb-4'), { wrapper })
  await waitFor(() => expect(other.result.current.isError).toBe(true))
  expect(other.result.current.error).toMatchObject({ status: 404 })
})

it('changes the status: the detail follows and the change is written in the follow-up', async () => {
  const { wrapper } = setup(ada)
  const detail = renderHook(() => useFeedbackDetail('fb-4'), { wrapper })
  const thread = renderHook(() => useThread('fb-4'), { wrapper })
  const change = renderHook(() => useChangeFeedback('fb-4'), { wrapper })
  await waitFor(() => expect(detail.result.current.data).toBeDefined())
  await waitFor(() => expect(thread.result.current.isLoading).toBe(false))
  expect(thread.result.current.messages).toEqual([])

  await act(() => change.result.current.mutateAsync({ statusId: 'planned' }))
  await waitFor(() => expect(detail.result.current.data?.statusId).toBe('planned'))
  await waitFor(() => expect(thread.result.current.messages).toHaveLength(1))
  expect(thread.result.current.messages[0]).toMatchObject({ kind: 'status_change', oldStatusId: 'new', newStatusId: 'planned' })
})

it('lets the author close but not change the type, and says why', async () => {
  const { wrapper } = setup(bob)
  const change = renderHook(() => useChangeFeedback('fb-2'), { wrapper })
  await expect(change.result.current.mutateAsync({ typeId: 'bug' })).rejects.toMatchObject({ status: 403 })
  await act(() => change.result.current.mutateAsync({ statusId: 'closed' }))
})

// ---- the follow-up

it('reads the follow-up from the newest message and goes back by cursor', async () => {
  const { wrapper, fake } = setup()
  const { result } = renderHook(() => useThread('fb-1'), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  const everything = fake.feedbacks.find((f) => f.id === 'fb-1')!.messages
  expect(everything).toHaveLength(19)
  expect(result.current.messages.map((m) => m.id)).toEqual(everything.slice(9).map((m) => m.id)) // the last ten, oldest first
  expect(result.current.total).toBe(19)
  expect(result.current.hidden).toBe(9)
  expect(result.current.hasOlder).toBe(true)

  act(() => result.current.loadOlder())
  await waitFor(() => expect(result.current.messages).toHaveLength(19))
  expect(result.current.messages.map((m) => m.id)).toEqual(everything.map((m) => m.id))
  expect(result.current.hidden).toBe(0)
  expect(result.current.hasOlder).toBe(false)
})

it('adds what is new to the newest page without leaving a gap before the older ones', async () => {
  const { wrapper, fake, client } = setup()
  const { result } = renderHook(() => useThread('fb-1'), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  const server = fake.feedbacks.find((f) => f.id === 'fb-1')!

  // three messages arrive while the follow-up is open
  for (const n of [1, 2, 3]) {
    server.messages.push({ ...server.messages[0], id: `new-${n}`, kind: 'comment', body: `new ${n}`, created_at: `2026-11-05T10:0${n}:00Z`, attachments: [] })
  }
  await act(() => refreshNewest(client, 'fb-1'))
  await waitFor(() => expect(result.current.messages.at(-1)?.body).toBe('new 3'))
  expect(result.current.total).toBe(22)

  act(() => result.current.loadOlder())
  await waitFor(() => expect(result.current.hasOlder).toBe(false))
  // every message once, in order, none missing: what a plain refetch of the pages would have broken
  expect(result.current.messages.map((m) => m.id)).toEqual(server.messages.map((m) => m.id))
})

it('does nothing for a follow-up that was never loaded', async () => {
  const { client } = setup()
  await refreshNewest(client, 'fb-2')
  expect(client.getQueryData(['feedback', 'thread', 'fb-2'])).toBeUndefined()
})

it('answers, and the answer appears at the end of the follow-up and moves the feedback up the list', async () => {
  const { wrapper } = setup()
  const list = renderHook(() => useFeedbackList('mine', NO_FILTER), { wrapper })
  const thread = renderHook(() => useThread('fb-3'), { wrapper })
  const reply = renderHook(() => useReply('fb-3'), { wrapper })
  await waitFor(() => expect(thread.result.current.isLoading).toBe(false))
  await waitFor(() => expect(list.result.current.items).toHaveLength(10))

  const file = new File(['x'], 'shot.png', { type: 'image/png' })
  await act(() => reply.result.current.mutateAsync({ body: 'Thanks!', files: [file] }))
  await waitFor(() => expect(thread.result.current.messages.at(-1)).toMatchObject({ body: 'Thanks!', authorUsername: 'ada' }))
  expect(thread.result.current.messages.at(-1)?.attachments).toHaveLength(1)
  await waitFor(() => expect(list.result.current.items[0].id).toBe('fb-3'))
})

it('refuses an answer the backend refuses', async () => {
  const { wrapper } = setup()
  const reply = renderHook(() => useReply('fb-3'), { wrapper })
  await expect(reply.result.current.mutateAsync({ body: '   ', files: [] })).rejects.toMatchObject({ status: 422 })
  const bad = new File(['x'], 'a.gif', { type: 'image/gif' })
  await expect(reply.result.current.mutateAsync({ body: 'hi', files: [bad] })).rejects.toMatchObject({ status: 415 })
})

// ---- sending

it('sends a feedback with its screenshots and the page, and it shows in the list', async () => {
  const { wrapper } = setup()
  const list = renderHook(() => useFeedbackList('mine', NO_FILTER), { wrapper })
  const create = renderHook(() => useCreateFeedback(), { wrapper })
  await waitFor(() => expect(list.result.current.total).toBe(12))

  const files = [new File(['x'], 'a.png', { type: 'image/png' })]
  let created: Awaited<ReturnType<typeof create.result.current.mutateAsync>> | undefined
  await act(async () => {
    created = await create.result.current.mutateAsync({ title: 'Cut text', description: 'On mobile', typeId: 'bug', files, page: '/settings' })
  })
  expect(created).toMatchObject({ title: 'Cut text', page: '/settings', statusId: 'new' })
  expect(created?.attachments).toHaveLength(1)
  await waitFor(() => expect(list.result.current.total).toBe(13))
  expect(list.result.current.items[0].title).toBe('Cut text')
})

it('does not send an empty page', async () => {
  const { wrapper, fake } = setup()
  const create = renderHook(() => useCreateFeedback(), { wrapper })
  await act(() => create.result.current.mutateAsync({ title: 't', description: 'd', typeId: 'bug', files: [], page: null }))
  expect(fake.feedbacks.at(-1)?.page).toBeNull()
})

it('refuses an archived type, an external page and too many screenshots', async () => {
  const { wrapper, fake } = setup()
  fake.types[3].archived = true
  const create = renderHook(() => useCreateFeedback(), { wrapper })
  const base = { title: 't', description: 'd', typeId: 'bug', files: [] as File[], page: null }
  await expect(create.result.current.mutateAsync({ ...base, typeId: 'other' })).rejects.toMatchObject({ status: 422 })
  await expect(create.result.current.mutateAsync({ ...base, page: 'https://evil.example' })).rejects.toMatchObject({ status: 422 })
  const six = Array.from({ length: 6 }, (_, i) => new File(['x'], `${i}.png`, { type: 'image/png' }))
  await expect(create.result.current.mutateAsync({ ...base, files: six })).rejects.toMatchObject({ status: 422, message: 'Too many screenshots' })
})

// the shape of a page the backend sends, kept next to its use
it('knows what a page of the follow-up looks like', () => {
  const page: WireMessagesPage = { items: [], total: 0, next_before: null }
  expect(page.next_before).toBeNull()
})
