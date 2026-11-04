import type { Filters } from '../components/FeedbackFilters'

/** The keys of the cache, in one place: a change invalidates the keys it touches. */
export const keys = {
  types: ['feedback-types'] as const,
  statuses: ['feedback-statuses'] as const,
  lists: ['feedback', 'list'] as const,
  list: (scope: 'mine' | 'all', filters: Filters) => ['feedback', 'list', scope, filters] as const,
  detail: (id: string) => ['feedback', 'detail', id] as const,
  thread: (id: string) => ['feedback', 'thread', id] as const,
}
