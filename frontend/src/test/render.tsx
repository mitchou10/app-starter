import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { AuthProvider } from '@/auth/AuthProvider'
import { routes } from '@/routes'

export const ada = { user_id: '1', email: 'ada@example.com', name: 'Ada', username: 'ada', roles: ['admin'], groups: [], is_admin: true }

/** Answers `/api/auth/me` (logged in with `user`, or 401 when null) and every other call with `others`. */
export function stubBackend(user: typeof ada | null, others: (url: string) => unknown = () => ({})) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url === '/api/auth/me' ? { ok: user !== null, json: async () => user } : { ok: true, json: async () => others(url) },
    ),
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
