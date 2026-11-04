import { MessageSquareText } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { applyFilters } from '../filters'
import { LIST_PAGE_SIZE } from '../pagination'
import { useFeedback } from '../FeedbackProvider'
import type { Feedback } from '../types'
import { FeedbackDetail } from './FeedbackDetail'
import { FeedbackFilters, NO_FILTER, type Filters } from './FeedbackFilters'
import { FeedbackList } from './FeedbackList'

interface FeedbackWorkspaceProps {
  feedbacks: Feedback[]
  /** The page: the list is `basePath`, a feedback is `basePath/<id>`. */
  basePath: string
  showAuthor?: boolean
  initialFilters?: Filters
}

/**
 * List on the left, the selected feedback on the right, on one page. The address says which one is open
 * (`basePath/<id>`), so it can be shared. On small screens the two take turns.
 */
export function FeedbackWorkspace({ feedbacks, basePath, showAuthor, initialFilters = NO_FILTER }: FeedbackWorkspaceProps) {
  const { t } = useTranslation()
  const { statuses } = useFeedback()
  const { id } = useParams()
  const [filters, setFilters] = useState(initialFilters)
  const [shown, setShown] = useState(LIST_PAGE_SIZE)

  const matching = applyFilters(feedbacks, filters, statuses, id)
  const page = matching.slice(0, shown)
  // The one being read stays in the list, even when it is further down than the pages loaded.
  const selected = matching.find((feedback) => feedback.id === id)
  const visible = selected && !page.includes(selected) ? [...page, selected] : page
  const remaining = matching.length - page.length

  return (
    <div className="grid gap-6 lg:h-[calc(100svh-13rem)] lg:grid-cols-[22rem_1fr]">
      <section aria-label={t('feedback.list.label')} className={cn('flex flex-col gap-4 lg:min-h-0', id && 'hidden lg:flex')}>
        <FeedbackFilters
          value={filters}
          onChange={(next) => {
            setFilters(next)
            setShown(LIST_PAGE_SIZE) // a new search starts again from the first page
          }}
        />
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          <FeedbackList feedbacks={visible} selectedId={id} basePath={basePath} showAuthor={showAuthor} />
          {matching.length > 0 && (
            <div className="mt-3 grid justify-items-center gap-2 pb-1">
              <p className="text-xs text-muted-foreground">{t('feedback.list.count', { shown: visible.length, total: matching.length })}</p>
              {remaining > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShown((count) => count + LIST_PAGE_SIZE)}>
                  {t('feedback.list.more', { count: Math.min(remaining, LIST_PAGE_SIZE) })}
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <section aria-label={t('feedback.detail.label')} className={cn('lg:min-h-0', !id && 'hidden lg:block')}>
        {id ? (
          <FeedbackDetail key={id} feedbackId={id} listPath={basePath} />
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 lg:h-full rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <MessageSquareText aria-hidden className="size-8" />
            {t('feedback.detail.select')}
          </div>
        )}
      </section>
    </div>
  )
}
