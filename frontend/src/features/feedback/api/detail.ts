import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { keys } from './keys'
import { toFeedback } from './mappers'
import { refreshNewest } from './thread'
import type { WireFeedback } from './wire'

/** One feedback. A 404 (it does not exist, or it is not yours) is an error the screen shows as "not found". */
export function useFeedbackDetail(feedbackId: string | undefined) {
  return useQuery({
    queryKey: keys.detail(feedbackId ?? ''),
    queryFn: async () => toFeedback(await api<WireFeedback>(`/api/feedback/${feedbackId}`)),
    enabled: feedbackId !== undefined,
    retry: false,
  })
}

/** Change the status or the type (admins), or close and reopen (the author: they send the status). */
export function useChangeFeedback(feedbackId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (change: { statusId?: string; typeId?: string }) =>
      api<WireFeedback>(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        json: { status_id: change.statusId, type_id: change.typeId },
      }),
    onSuccess: async (changed) => {
      client.setQueryData(keys.detail(feedbackId), toFeedback(changed))
      // A change of status is written in the follow-up.
      await refreshNewest(client, feedbackId)
      await client.invalidateQueries({ queryKey: keys.lists })
    },
  })
}
