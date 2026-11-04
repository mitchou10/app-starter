import { type InfiniteData, useInfiniteQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { THREAD_PAGE_SIZE } from '../pagination'
import { api } from './client'
import { keys } from './keys'
import { toMessagesPage } from './mappers'
import type { FeedbackMessage } from '../types'
import type { WireMessage, WireMessagesPage } from './wire'

type Pages = InfiniteData<WireMessagesPage, string | undefined>

function address(feedbackId: string, before?: string) {
  const params = new URLSearchParams({ limit: String(THREAD_PAGE_SIZE) })
  if (before) params.set('before', before)
  return `/api/feedback/${feedbackId}/messages?${params}`
}

/**
 * The follow-up. The first page holds the newest messages, `loadOlder` fetches the one before (by cursor). `messages`
 * is everything loaded so far, oldest first, the way it is read.
 */
export function useThread(feedbackId: string) {
  const query = useInfiniteQuery({
    queryKey: keys.thread(feedbackId),
    queryFn: ({ pageParam }) => api<WireMessagesPage>(address(feedbackId, pageParam)),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_before ?? undefined,
    // Refetching an infinite query reloads every page from its saved cursor, which can leave a gap once messages have
    // been added: the newest page is merged instead (refreshNewest), by the actions and by the clock below.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const messages = useMemo<FeedbackMessage[]>(
    () => [...(query.data?.pages ?? [])].reverse().flatMap((page) => toMessagesPage(page).items),
    [query.data],
  )
  const total = query.data?.pages[0]?.total ?? 0
  return {
    messages,
    total,
    /** How many messages are older than what is loaded. */
    hidden: Math.max(total - messages.length, 0),
    hasOlder: query.hasNextPage,
    loadOlder: () => void query.fetchNextPage(),
    loadingOlder: query.isFetchingNextPage,
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
  }
}

const sameOrder = (a: WireMessage, b: WireMessage) =>
  a.created_at === b.created_at ? a.id.localeCompare(b.id) : a.created_at.localeCompare(b.created_at)

/**
 * Brings the newest messages into the cache without touching the older pages: whatever is new is added to the first
 * page, and the cursor to the older ones stays valid. Nothing happens when the follow-up was not loaded.
 */
export async function refreshNewest(client: QueryClient, feedbackId: string) {
  const fresh = await api<WireMessagesPage>(address(feedbackId))
  client.setQueryData<Pages>(keys.thread(feedbackId), (old) => {
    if (!old) return old
    const [first, ...others] = old.pages
    const known = new Set(first.items.map((message) => message.id))
    const added = fresh.items.filter((message) => !known.has(message.id))
    if (added.length === 0 && fresh.total === first.total) return old
    const items = [...first.items, ...added].sort(sameOrder)
    return { ...old, pages: [{ ...first, items, total: fresh.total }, ...others] }
  })
}

/** Answer, with screenshots. */
export function useReply(feedbackId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ body, files }: { body: string; files: File[] }) => {
      const form = new FormData()
      form.append('body', body)
      files.forEach((file) => form.append('files', file))
      return api<WireMessage>(`/api/feedback/${feedbackId}/messages`, { method: 'POST', form })
    },
    onSuccess: async () => {
      await refreshNewest(client, feedbackId)
      // The feedback moved to the top of the lists, and its count of answers changed.
      await client.invalidateQueries({ queryKey: keys.lists })
      await client.invalidateQueries({ queryKey: keys.detail(feedbackId) })
    },
  })
}

/** While the feedback is open, picks up what others add (the team answers, a status changes) every few seconds. */
export function useLiveRefresh(feedbackId: string, everyMs = 15_000) {
  const client = useQueryClient()
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void refreshNewest(client, feedbackId).catch(() => {})
      void client.invalidateQueries({ queryKey: keys.detail(feedbackId) })
    }, everyMs)
    return () => clearInterval(id)
  }, [client, feedbackId, everyMs])
}
