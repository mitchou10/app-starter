import type { FeedbackMessage } from '../types'
import { ThreadItem } from './ThreadItem'

export function FeedbackThread({ messages }: { messages: FeedbackMessage[] }) {
  if (messages.length === 0) return null
  return (
    <ol className="grid gap-4">
      {messages.map((message) => (
        <ThreadItem key={message.id} message={message} />
      ))}
    </ol>
  )
}
