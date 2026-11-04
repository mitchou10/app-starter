import { byId } from './format'
import type { Feedback, FeedbackStatus } from './types'
import type { Filters } from './components/FeedbackFilters'

/**
 * "open" is every status that is not closed. `keepId`: the feedback being read stays in the list even when the
 * filters would hide it (it was just closed...).
 */
export function applyFilters(feedbacks: Feedback[], filters: Filters, statuses: FeedbackStatus[], keepId?: string) {
  return feedbacks
    .filter((feedback) => {
      if (feedback.id === keepId) return true
      if (filters.status === 'open') return !byId(statuses, feedback.statusId)?.isClosed
      return filters.status === 'all' || feedback.statusId === filters.status
    })
    .filter((feedback) => feedback.id === keepId || filters.type === 'all' || feedback.typeId === filters.type)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
