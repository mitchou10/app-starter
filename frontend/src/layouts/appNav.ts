import { Home, type LucideIcon } from 'lucide-react'

/** Entries of the sidebar. `key` is the translation `appNav.<key>`; `to` is the route. */
export const APP_NAV: { key: string; to: string; icon: LucideIcon }[] = [{ key: 'home', to: '/app', icon: Home }]
