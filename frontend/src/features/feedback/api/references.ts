import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toStatus, toType } from './mappers'
import { keys } from './keys'
import type { FeedbackStatus, FeedbackType, ReferenceInput } from '../types'
import type { WireReference, WireStatus } from './wire'

const FIVE_MINUTES = 5 * 60_000
const NONE: never[] = []

export function useFeedbackTypes() {
  return useQuery({
    queryKey: keys.types,
    queryFn: async () => (await api<WireReference[]>('/api/feedback-types')).map(toType),
    staleTime: FIVE_MINUTES,
  })
}

export function useFeedbackStatuses() {
  return useQuery({
    queryKey: keys.statuses,
    queryFn: async () => (await api<WireStatus[]>('/api/feedback-statuses')).map(toStatus),
    staleTime: FIVE_MINUTES,
  })
}

/** Both lists, empty until they are loaded: what the badges and the dropdowns are made of. */
export function useReferences(): { types: FeedbackType[]; statuses: FeedbackStatus[]; ready: boolean } {
  const types = useFeedbackTypes()
  const statuses = useFeedbackStatuses()
  return { types: types.data ?? NONE, statuses: statuses.data ?? NONE, ready: types.isSuccess && statuses.isSuccess }
}

type Kind = 'type' | 'status'
const ENDPOINT = { type: '/api/admin/feedback-types', status: '/api/admin/feedback-statuses' } as const
const KEYS = { type: keys.types, status: keys.statuses } as const

/** Admin: add a type or a status (no `id`), or change one. */
export function useSaveReference(kind: Kind) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ input, id }: { input: ReferenceInput; id?: string }) => {
      const json = {
        name: input.name,
        description: input.description,
        tone: input.tone,
        ...(kind === 'status' && input.isClosed !== undefined ? { is_closed: input.isClosed } : {}),
      }
      return id
        ? api(`${ENDPOINT[kind]}/${id}`, { method: 'PATCH', json })
        : api(ENDPOINT[kind], { method: 'POST', json })
    },
    onSuccess: () => client.invalidateQueries({ queryKey: KEYS[kind] }),
  })
}

/** Admin: archive a value, or restore it. */
export function useArchiveReference(kind: Kind) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      api(`${ENDPOINT[kind]}/${id}`, { method: 'PATCH', json: { archived } }),
    onSuccess: () => client.invalidateQueries({ queryKey: KEYS[kind] }),
  })
}
