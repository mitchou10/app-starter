import { useInfiniteQuery } from '@tanstack/react-query'
import type { Filters } from '../components/FeedbackFilters'
import { LIST_PAGE_SIZE } from '../pagination'
import { api } from './client'
import { keys } from './keys'
import { toSummary } from './mappers'
import type { FeedbackSummary } from '../types'
import type { WirePage, WireSummary } from './wire'

export type Scope = 'mine' | 'all'

function address(scope: Scope, filters: Filters, offset: number) {
  const params = new URLSearchParams({ limit: String(LIST_PAGE_SIZE), offset: String(offset) })
  if (filters.status !== 'all') params.set('status', filters.status)
  if (filters.type !== 'all') params.set('type_id', filters.type)
  return `${scope === 'all' ? '/api/admin/feedback' : '/api/feedback'}?${params}`
}

/** A list of feedback, a page at a time: `fetchNextPage` adds the next one. `all` is for admins. */
export function useFeedbackList(scope: Scope, filters: Filters) {
  const query = useInfiniteQuery({
    queryKey: keys.list(scope, filters),
    queryFn: ({ pageParam }) => api<WirePage<WireSummary>>(address(scope, filters, pageParam)),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.offset + last.items.length < last.total ? last.offset + last.limit : undefined),
  })
  const items: FeedbackSummary[] = query.data?.pages.flatMap((page) => page.items.map(toSummary)) ?? []
  return {
    items,
    total: query.data?.pages[0]?.total ?? 0,
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
    hasMore: query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    loadingMore: query.isFetchingNextPage,
  }
}
