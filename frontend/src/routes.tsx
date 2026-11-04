import type { RouteObject } from 'react-router'
import { RequireAuth } from '@/auth/RequireAuth'
import { LandingPage } from '@/features/landing/LandingPage'
import { RootLayout } from '@/layouts/RootLayout'
import { AccountPage } from '@/pages/AccountPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * Every page of the app. To add one: create it in src/pages (or src/features/<name>), add a line here, and a link
 * in src/layouts/nav.ts if it belongs in the header. Put it under <RequireAuth> if it needs a logged-in user.
 */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { element: <RequireAuth />, children: [{ path: 'account', element: <AccountPage /> }] },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
