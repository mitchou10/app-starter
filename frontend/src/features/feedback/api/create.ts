import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { keys } from './keys'
import { toFeedback } from './mappers'
import type { NewFeedback } from '../types'
import type { WireFeedback } from './wire'

/** Send a feedback, with its screenshots and the page it was sent from. */
export function useCreateFeedback() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewFeedback) => {
      const form = new FormData()
      form.append('title', input.title)
      form.append('description', input.description)
      form.append('type_id', input.typeId)
      if (input.page) form.append('page', input.page)
      input.files.forEach((file) => form.append('files', file))
      return toFeedback(await api<WireFeedback>('/api/feedback', { method: 'POST', form }))
    },
    onSuccess: () => client.invalidateQueries({ queryKey: keys.lists }),
  })
}
