import { Outlet } from 'react-router'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { useCurrentUser } from './AuthProvider'

/** Layout route, used inside RequireAuth: only users with the admin role get through. The backend checks it too. */
export function RequireAdmin() {
  const { user } = useCurrentUser()
  return user?.is_admin ? <Outlet /> : <ForbiddenPage />
}
