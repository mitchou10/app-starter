import { MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { useFeedback } from '../FeedbackProvider'
import { byId, formatDate } from '../format'
import type { Feedback } from '../types'
import { ReferenceBadge } from './ReferenceBadge'

interface FeedbackListProps {
  feedbacks: Feedback[]
  /** The feedback being read, highlighted. */
  selectedId?: string
  /** Where an item leads: `${basePath}/${id}`. */
  basePath: string
  /** The admin list shows who wrote each feedback. */
  showAuthor?: boolean
}

/** The column of feedback on the left of the page: title, badges and date, one block each. */
export function FeedbackList({ feedbacks, selectedId, basePath, showAuthor = false }: FeedbackListProps) {
  const { t, i18n } = useTranslation()
  const { types, statuses } = useFeedback()

  if (feedbacks.length === 0) {
    return <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{t('feedback.list.empty')}</p>
  }

  return (
    <ul className="grid gap-2">
      {feedbacks.map((feedback) => {
        const type = byId(types, feedback.typeId)
        const status = byId(statuses, feedback.statusId)
        const replies = feedback.messages.filter((message) => message.kind === 'comment').length
        const selected = feedback.id === selectedId
        return (
          <li key={feedback.id}>
            <Link
              to={`${basePath}/${feedback.id}`}
              aria-current={selected ? 'true' : undefined}
              className={cn('block rounded-lg border p-3 transition-colors hover:bg-muted/60', selected && 'border-foreground/30 bg-muted')}
            >
              <span className="line-clamp-2 font-medium">{feedback.title}</span>
              <span className="mt-2 flex flex-wrap items-center gap-1.5">
                {type && <ReferenceBadge name={type.name} tone={type.tone} />}
                {status && <ReferenceBadge name={status.name} tone={status.tone} />}
              </span>
              <span className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">
                  {showAuthor && `${feedback.createdByUsername} · `}
                  {formatDate(feedback.updatedAt, i18n.language)}
                </span>
                {replies > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-1" title={t('feedback.list.replies')}>
                    <MessageSquare aria-hidden className="size-3.5" />
                    {replies}
                  </span>
                )}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
