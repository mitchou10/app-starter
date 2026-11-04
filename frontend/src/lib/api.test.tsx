import { expect, it, vi } from 'vitest'
import { ada, Reply, stubBackend } from '@/test/render'
import { api, ApiError } from './api'
import { errorKind } from './errors'

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
  expect(kind(409, 'A value with this name already exists')).toBe('duplicate')
  expect(kind(409, 'This status is used by the app itself and cannot be archived')).toBe('conflict')
  expect(kind(413)).toBe('tooLarge')
  expect(kind(415)).toBe('unsupported')
  expect(kind(422, 'Too many screenshots')).toBe('tooMany')
  expect(kind(422, 'The message is empty')).toBe('invalid')
  expect(kind(500)).toBe('failed')
  expect(errorKind(new TypeError('Failed to fetch'))).toBe('network')
})

