import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { FeedbackMessage } from '../types'
import { ThreadItem } from './ThreadItem'

export const THREAD_PAGE_SIZE = 10

/**
 * The follow-up: answers and changes of status, oldest first, in a box that scrolls on its own. It opens on the
 * latest message and goes back there when one arrives. Only the latest ones are shown; the older ones are loaded
 * by page, from the top, without moving what is being read.
 */
export function FeedbackThread({ messages, pageSize = THREAD_PAGE_SIZE }: { messages: FeedbackMessage[]; pageSize?: number }) {
  const { t } = useTranslation()
  const box = useRef<HTMLDivElement>(null)
  const heightBefore = useRef(0)
  const [shown, setShown] = useState(pageSize)
  const visible = messages.slice(-shown)
  const hidden = messages.length - visible.length

  // The latest message at the bottom, when the thread opens and each time one is added.
  useLayoutEffect(() => {
    const element = box.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messages.length])

  // Older messages were added above: keep the reader where they were instead of jumping to the top.
  useLayoutEffect(() => {
    const element = box.current
    if (element && heightBefore.current) {
      element.scrollTop += element.scrollHeight - heightBefore.current
      heightBefore.current = 0
    }
  }, [shown])

  function loadOlder() {
    heightBefore.current = box.current?.scrollHeight ?? 0
    setShown((count) => count + pageSize)
  }

  return (
    <div
      ref={box}
      role="log"
      aria-label={t('feedback.thread.label')}
      className="max-h-[60svh] min-h-48 flex-1 overflow-y-auto rounded-lg border p-3 lg:max-h-none"
    >
      {messages.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{t('feedback.thread.empty')}</p>}
      {hidden > 0 && (
        <div className="mb-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={loadOlder}>
            {t('feedback.thread.older', { count: Math.min(hidden, pageSize), total: hidden })}
          </Button>
        </div>
      )}
      <ol className="grid gap-4">
        {visible.map((message) => (
          <ThreadItem key={message.id} message={message} />
        ))}
      </ol>
    </div>
  )
}
