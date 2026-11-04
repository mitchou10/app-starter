import { MessageSquareText } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { cn } from '@/lib/utils'
import { applyFilters } from '../filters'
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

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
      <section aria-label={t('feedback.list.label')} className={cn('grid gap-4', id && 'hidden lg:grid')}>
        <FeedbackFilters value={filters} onChange={setFilters} />
        <div className="lg:max-h-[calc(100svh-17rem)] lg:overflow-y-auto lg:pr-1">
          <FeedbackList feedbacks={applyFilters(feedbacks, filters, statuses, id)} selectedId={id} basePath={basePath} showAuthor={showAuthor} />
        </div>
      </section>

      <section aria-label={t('feedback.detail.label')} className={cn(!id && 'hidden lg:block')}>
        {id ? (
          <FeedbackDetail key={id} feedbackId={id} listPath={basePath} />
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <MessageSquareText aria-hidden className="size-8" />
            {t('feedback.detail.select')}
          </div>
        )}
      </section>
    </div>
  )
}
