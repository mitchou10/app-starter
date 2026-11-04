import type { FeedbackStatus, FeedbackType } from './types'

export const byId = <T extends { id: string }>(items: T[], id: string) => items.find((item) => item.id === id)

/** Active values first, in order; archived ones only when a feedback still uses them. */
export const offered = <T extends FeedbackType | FeedbackStatus>(items: T[], keep?: string) =>
  items.filter((item) => !item.archived || item.id === keep).sort((a, b) => ('position' in a && 'position' in b ? a.position - b.position : 0))

export function formatDate(iso: string, language: string, withTime = false) {
  return new Intl.DateTimeFormat(language, withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(iso))
}
