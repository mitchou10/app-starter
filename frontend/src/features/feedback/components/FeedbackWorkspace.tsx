import { MessageSquareText } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFeedbackDetail } from '../api/detail'
import { type Scope, useFeedbackList } from '../api/list'
import { LIST_PAGE_SIZE } from '../pagination'
import type { Feedback, FeedbackSummary } from '../types'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FeedbackDetail } from './FeedbackDetail'
import { FeedbackFilters, NO_FILTER, type Filters } from './FeedbackFilters'
import { FeedbackList } from './FeedbackList'

interface FeedbackWorkspaceProps {
  /** `mine`: what the user sent. `all`: everything, for admins. */
  scope: Scope
  /** The page: the list is `basePath`, a feedback is `basePath/<id>`. */
  basePath: string
  showAuthor?: boolean
  initialFilters?: Filters
}

/** The line of the list for the feedback being read, when the pages loaded do not hold it. */
const asSummary = (feedback: Feedback): FeedbackSummary => ({ ...feedback, repliesCount: 0 })

/**
 * List on the left, the selected feedback on the right, on one page. The address says which one is open
 * (`basePath/<id>`), so it can be shared. On small screens the two take turns.
 */
export function FeedbackWorkspace({ scope, basePath, showAuthor, initialFilters = NO_FILTER }: FeedbackWorkspaceProps) {
  const { t } = useTranslation()
  const { id } = useParams()
  const [filters, setFilters] = useState(initialFilters)
  const list = useFeedbackList(scope, filters)
  const open = useFeedbackDetail(id)

  // The one being read stays in the list, even when the filters or the pages loaded would leave it out.
  const reading = open.data
  const items =
    reading && !list.items.some((item) => item.id === reading.id)
      ? [...list.items, asSummary(reading)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      : list.items
  const remaining = Math.max(list.total - list.items.length, 0)

  return (
    <div className="grid gap-6 lg:h-[calc(100svh-13rem)] lg:grid-cols-[22rem_1fr]">
      <section aria-label={t('feedback.list.label')} className={cn('flex flex-col gap-4 lg:min-h-0', id && 'hidden lg:flex')}>
        <FeedbackFilters value={filters} onChange={setFilters} />
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {list.isLoading && <p className="p-4 text-center text-sm text-muted-foreground">{t('feedback.state.loading')}</p>}
          {list.isError && <ErrorNotice error={list.error} className="p-4 text-center text-sm text-destructive" />}
          {!list.isLoading && !list.isError && (
            <FeedbackList feedbacks={items} selectedId={id} basePath={basePath} showAuthor={showAuthor} />
          )}
          {items.length > 0 && (
            <div className="mt-3 grid justify-items-center gap-2 pb-1">
              <p className="text-xs text-muted-foreground">{t('feedback.list.count', { shown: items.length, total: list.total })}</p>
              {list.hasMore && (
                <Button variant="outline" size="sm" disabled={list.loadingMore} onClick={list.loadMore}>
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
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center text-muted-foreground lg:h-full">
            <MessageSquareText aria-hidden className="size-8" />
            {t('feedback.detail.select')}
          </div>
        )}
      </section>
    </div>
  )
}
