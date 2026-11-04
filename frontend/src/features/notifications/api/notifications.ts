import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Notification, NotificationFilter } from '../types'
import type { WireNotification, WirePage } from './wire'

const PAGE_SIZE = 10
/** How often the badge asks for the count while the page is open: it is what makes a new notification appear. */
export const UNREAD_POLL_MS = 30_000

const keys = {
  all: ['notifications'] as const,
  list: (filter: NotificationFilter) => ['notifications', 'list', filter] as const,
  unread: ['notifications', 'unread-count'] as const,
}

const toNotification = (n: WireNotification): Notification => ({
  id: n.id,
  source: n.source,
  title: n.title,
  description: n.description,
  url: n.url,
  createdAt: n.created_at,
  read: n.read,
})

/** My notifications, newest first, a page at a time: `loadMore` adds the next one. */
export function useNotifications(filter: NotificationFilter) {
  const query = useInfiniteQuery({
    queryKey: keys.list(filter),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(pageParam) })
      if (filter === 'unread') params.set('unread', 'true')
      return api<WirePage<WireNotification>>(`/api/notifications?${params}`)
    },
    initialPageParam: 0,
    getNextPageParam: (last) => (last.offset + last.items.length < last.total ? last.offset + last.limit : undefined),
  })
  const items = query.data?.pages.flatMap((page) => page.items.map(toNotification)) ?? []
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

/** How many notifications I have not read: what the badge shows. 0 until it is known. */
export function useUnreadCount(): number {
  const query = useQuery({
    queryKey: keys.unread,
    queryFn: async () => (await api<{ count: number }>('/api/notifications/unread-count')).count,
    refetchInterval: UNREAD_POLL_MS,
    staleTime: 10_000,
  })
  return query.data ?? 0
}

/** Mark one notification read, or unread again. */
export function useSetRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      api(`/api/notifications/${id}`, { method: 'PATCH', json: { read } }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
  })
}

export function useMarkAllRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => api<{ updated: number }>('/api/notifications/read-all', { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
  })
}
