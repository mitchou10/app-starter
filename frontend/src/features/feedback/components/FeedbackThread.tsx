import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { THREAD_PAGE_SIZE } from '../pagination'
import type { FeedbackMessage } from '../types'
import { ThreadItem } from './ThreadItem'

interface FeedbackThreadProps {
  /** What is loaded, oldest first. */
  messages: FeedbackMessage[]
  /** How many messages are older than those loaded. */
  hidden: number
  loadingOlder?: boolean
  onLoadOlder: () => void
  loading?: boolean
  pageSize?: number
}

/**
 * The follow-up: answers and changes of status, oldest first, in a box that scrolls on its own. It opens on the
 * latest message and goes back there when one arrives. When older ones are loaded, they are added above without
 * moving what is being read.
 */
export function FeedbackThread({ messages, hidden, loadingOlder = false, onLoadOlder, loading = false, pageSize = THREAD_PAGE_SIZE }: FeedbackThreadProps) {
  const { t } = useTranslation()
  const box = useRef<HTMLDivElement>(null)
  const heightBefore = useRef(0)
  const first = useRef<string>(undefined)
  const last = useRef<string>(undefined)

  useLayoutEffect(() => {
    const element = box.current
    if (!element) return
    const newFirst = messages[0]?.id
    const newLast = messages.at(-1)?.id
    if (heightBefore.current && newFirst !== first.current) {
      // Older messages were added above: keep the reader where they were instead of jumping to the top.
      element.scrollTop += element.scrollHeight - heightBefore.current
      heightBefore.current = 0
    } else if (newLast !== last.current) {
      // The thread opened, or a message arrived: the latest one is shown.
      element.scrollTop = element.scrollHeight
    }
    first.current = newFirst
    last.current = newLast
  }, [messages])

  function loadOlder() {
    heightBefore.current = box.current?.scrollHeight ?? 0
    onLoadOlder()
  }

  return (
    <div
      ref={box}
      role="log"
      aria-label={t('feedback.thread.label')}
      aria-busy={loading}
      className="max-h-[60svh] min-h-48 flex-1 overflow-y-auto rounded-lg border p-3 lg:max-h-none"
    >
      {loading && <p className="py-8 text-center text-sm text-muted-foreground">{t('feedback.state.loading')}</p>}
      {!loading && messages.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{t('feedback.thread.empty')}</p>}
      {hidden > 0 && (
        <div className="mb-4 flex justify-center">
          <Button variant="outline" size="sm" disabled={loadingOlder} onClick={loadOlder}>
            {t('feedback.thread.older', { count: Math.min(hidden, pageSize), total: hidden })}
          </Button>
        </div>
      )}
      <ol className="grid gap-4">
        {messages.map((message) => (
          <ThreadItem key={message.id} message={message} />
        ))}
      </ol>
    </div>
  )
}
