import { byId } from './format'
import type { Feedback, FeedbackStatus } from './types'
import type { Filters } from './components/FeedbackFilters'

/** "open" is every status that is not closed. */
export function applyFilters(feedbacks: Feedback[], filters: Filters, statuses: FeedbackStatus[]) {
  return feedbacks
    .filter((feedback) => {
      if (filters.status === 'open') return !byId(statuses, feedback.statusId)?.isClosed
      return filters.status === 'all' || feedback.statusId === filters.status
    })
    .filter((feedback) => filters.type === 'all' || feedback.typeId === filters.type)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
