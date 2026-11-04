import type { RouteObject } from 'react-router'
import { RequireAdmin } from '@/auth/RequireAdmin'
import { RequireAuth } from '@/auth/RequireAuth'
import { AdminFeedbackPage } from '@/features/feedback/pages/AdminFeedbackPage'
import { MyFeedbackPage } from '@/features/feedback/pages/MyFeedbackPage'
import { LandingPage } from '@/features/landing/LandingPage'
import { AppLayout } from '@/layouts/AppLayout'
import { RootLayout } from '@/layouts/RootLayout'
import { AppHomePage } from '@/pages/AppHomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SettingsPage } from '@/pages/SettingsPage'

/**
 * Two worlds:
 *  - public pages (landing, 404) in RootLayout: header on top, footer at the bottom;
 *  - the app, for logged-in users, in AppLayout: sidebar on the left with the profile menu.
 *
 * To add a page of the app: create it in src/pages (or src/features/<name>), add a line under AppLayout here and an
 * entry in src/layouts/appNav.ts. To add a public page: add a line under RootLayout.
 */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: 'app', element: <AppHomePage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'feedback', element: <MyFeedbackPage /> },
          { path: 'feedback/:id', element: <MyFeedbackPage /> },
          {
            element: <RequireAdmin />,
            children: [
              { path: 'admin/feedback', element: <AdminFeedbackPage view="feedback" /> },
              { path: 'admin/feedback/settings', element: <AdminFeedbackPage view="settings" /> },
              { path: 'admin/feedback/:id', element: <AdminFeedbackPage view="feedback" /> },
            ],
          },
        ],
      },
    ],
  },
]
