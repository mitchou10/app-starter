import { GitBranch, Languages, Layout, Package, Server, ShieldCheck, type LucideIcon } from 'lucide-react'

/**
 * What the landing page says. The texts are in src/i18n/locales/*.json under `landing.features.<key>`:
 * add an entry here and its `title` / `description` in each language.
 */
export const FEATURES: { key: string; icon: LucideIcon }[] = [
  { key: 'backend', icon: Server },
  { key: 'frontend', icon: Layout },
  { key: 'auth', icon: ShieldCheck },
  { key: 'releases', icon: GitBranch },
  { key: 'i18n', icon: Languages },
  { key: 'containers', icon: Package },
]
