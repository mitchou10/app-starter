import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { AuthProvider } from '@/auth/AuthProvider'
import { routes } from '@/routes'

export const ada = { user_id: '1', email: 'ada@example.com', name: 'Ada', username: 'ada', roles: ['admin'], groups: [], is_admin: true }

export const bob = { ...ada, user_id: '2', email: 'bob@example.com', name: 'Bob', username: 'bob', roles: [], is_admin: false }

/**
 * Answers `/api/auth/me` (logged in with `user`, or 401 when null) and every other call with `others`, which gets
 * the url and the options and returns the body, or a `{ status }` to answer with that status.
 */
export function stubBackend(
  user: typeof ada | null,
  others: (url: string, init?: RequestInit) => unknown = () => ({}),
) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url === '/api/auth/me') return { ok: user !== null, status: user ? 200 : 401, json: async () => user }
      const body = others(url, init)
      if (body && typeof body === 'object' && 'status' in body) {
        const { status } = body as { status: number }
        return { ok: status < 400, status, json: async () => ({}) }
      }
      return { ok: true, status: 200, json: async () => body }
    }),
  )
}

/** A component alone, with the router and the auth it may rely on. */
export function renderWithProviders(ui: ReactElement) {
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>,
  )
}

/** The whole app (layout + routes) opened at `path`. */
export function renderApp(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
  return router
}
