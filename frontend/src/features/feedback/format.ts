import type { FeedbackStatus, FeedbackType } from './types'

export const byId = <T extends { id: string }>(items: T[], id: string) => items.find((item) => item.id === id)

/** What can be chosen now: active values in order. `keep` stays when a feedback still has it, archived or not. */
export const offered = <T extends FeedbackType | FeedbackStatus>(items: T[], keep?: string) =>
  items.filter((item) => !item.archived || item.id === keep).sort((a, b) => a.position - b.position)

export function formatDate(iso: string, language: string, withTime = false) {
  return new Intl.DateTimeFormat(language, withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(iso))
}
