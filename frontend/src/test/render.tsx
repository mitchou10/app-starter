import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { AuthProvider } from '@/auth/AuthProvider'
import { routes } from '@/routes'
import { createFakeFeedbackApi, Reply } from './fakeFeedbackApi'
import { createFakeNotificationsApi, type SeedNotification } from './fakeNotificationsApi'

export { Reply }

export const ada = { user_id: '1', email: 'ada@example.com', name: 'Ada', username: 'ada', roles: ['admin'], groups: [], is_admin: true }

export const bob = { ...ada, user_id: '2', email: 'bob@example.com', name: 'Bob', username: 'bob', roles: [], is_admin: false }

/**
 * Answers `/api/auth/me` (logged in with `user`, or 401 when null) and every other call with `others`, which gets
 * the url and the options and returns the body, a `{ status }` or a `Reply`. Without `others`, the feedback and the
 * notifications APIs in memory answer (see fakeFeedbackApi.ts and fakeNotificationsApi.ts), as `user`; the
 * notifications start with `options.notifications`. Returns what they hold.
 */
export function stubBackend(
  user: typeof ada | null,
  others?: (url: string, init?: RequestInit) => unknown,
  options: { notifications?: SeedNotification[] } = {},
) {
  const feedback = createFakeFeedbackApi(user && { user_id: user.user_id, username: user.username, name: user.name, is_admin: user.is_admin })
  const notifications = createFakeNotificationsApi(user !== null, options.notifications)
  const answer = others ?? ((url: string, init?: RequestInit) => feedback.handle(url, init) ?? notifications.handle(url, init))
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url === '/api/auth/me') return { ok: user !== null, status: user ? 200 : 401, json: async () => user }
      const body = answer(url, init) ?? {}
      if (body instanceof Reply) return { ok: body.status < 400, status: body.status, statusText: String(body.status), json: async () => body.body }
      if (typeof body === 'object' && 'status' in body) {
        const { status } = body as { status: number }
        return { ok: status < 400, status, statusText: String(status), json: async () => ({}) }
      }
      return { ok: true, status: 200, json: async () => body }
    }),
  )
  return { ...feedback, notifications }
}

/** A client that does not retry or wait: a test sees the first answer. */
export const testQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })

/** A component alone, with the router and the auth it may rely on. */
export function renderWithProviders(ui: ReactElement) {
  return render(
    <QueryClientProvider client={testQueryClient()}>
      <AuthProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

/** The whole app (layout + routes) opened at `path`. */
export function renderApp(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={testQueryClient()}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return router
}
