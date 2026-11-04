import { Home, Inbox, SlidersHorizontal, type LucideIcon } from 'lucide-react'

interface NavEntry {
  /** The translation `appNav.<key>`. */
  key: string
  to: string
  icon: LucideIcon
}

/** Entries of the sidebar for everybody. */
export const APP_NAV: NavEntry[] = [{ key: 'home', to: '/app', icon: Home }]

/** Entries of the "Administration" group of the profile menu (not of the sidebar, which stays light): admins only. */
export const ADMIN_NAV: NavEntry[] = [
  { key: 'adminFeedback', to: '/admin/feedback', icon: Inbox },
  { key: 'adminFeedbackSettings', to: '/admin/feedback/settings', icon: SlidersHorizontal },
]
