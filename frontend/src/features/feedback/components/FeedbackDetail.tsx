import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useFeedbackDetail } from '../api/detail'
import { errorKind } from '@/lib/errors'
import { useReferences } from '../api/references'
import { useLiveRefresh, useThread } from '../api/thread'
import { byId, formatDate } from '../format'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FeedbackControls } from './FeedbackControls'
import { FeedbackThread } from './FeedbackThread'
import { ReferenceBadge } from './ReferenceBadge'
import { ReplyBox } from './ReplyBox'
import { Screenshots } from './Screenshots'

interface FeedbackDetailProps {
  feedbackId: string
  /** The list this detail belongs to: the "back" link on small screens, where list and detail take turns. */
  listPath: string
}

/** One feedback with its follow-up. Shared by the author and the admins. */
export function FeedbackDetail({ feedbackId, listPath }: FeedbackDetailProps) {
  const { t, i18n } = useTranslation()
  const detail = useFeedbackDetail(feedbackId)
  const thread = useThread(feedbackId)
  const { types, statuses } = useReferences()
  useLiveRefresh(feedbackId)

  const back = (
    <Link to={listPath} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden">
      <ArrowLeft aria-hidden className="size-4" />
      {t('feedback.detail.back')}
    </Link>
  )

  if (detail.isPending) {
    return <p className="p-8 text-center text-sm text-muted-foreground">{t('feedback.state.loading')}</p>
  }

  if (detail.isError) {
    // Somebody else's feedback looks like it does not exist, for the backend says 404 to anyone but the author and the admins.
    return (
      <div className="grid gap-4">
        {back}
        {errorKind(detail.error) === 'notFound' ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{t('feedback.detail.notFound')}</p>
        ) : (
          <ErrorNotice error={detail.error} />
        )}
      </div>
    )
  }

  const feedback = detail.data
  const type = byId(types, feedback.typeId)
  const status = byId(statuses, feedback.statusId)

  return (
    <article className="flex min-h-0 flex-col gap-3 lg:h-full lg:overflow-y-auto">
      {back}
      <header className="grid shrink-0 gap-3">
        <h2 className="text-2xl font-semibold">{feedback.title}</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {type && <ReferenceBadge name={type.name} tone={type.tone} />}
          {status && <ReferenceBadge name={status.name} tone={status.tone} />}
          <span>{t('feedback.detail.by', { name: feedback.createdByUsername, date: formatDate(feedback.createdAt, i18n.language, true) })}</span>
          {feedback.page && (
            <span>
              {t('feedback.detail.page')}{' '}
              <Link to={feedback.page} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground hover:underline">
                {feedback.page}
              </Link>
            </span>
          )}
        </div>
        <FeedbackControls feedback={feedback} />
      </header>

      {/* The text and the screenshots side by side, each scrolling inside its own box if it is long. */}
      <div className="flex shrink-0 flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start">
        <p className="max-h-24 flex-1 overflow-y-auto text-sm whitespace-pre-wrap">{feedback.description}</p>
        {feedback.attachments.length > 0 && (
          <div className="max-h-24 shrink-0 overflow-y-auto sm:w-44">
            <Screenshots attachments={feedback.attachments} compact />
          </div>
        )}
      </div>

      <div className="flex min-h-48 flex-1 flex-col">
        <FeedbackThread
          messages={thread.messages}
          hidden={thread.hidden}
          loading={thread.isLoading}
          loadingOlder={thread.loadingOlder}
          onLoadOlder={thread.loadOlder}
        />
        {thread.isError && <ErrorNotice error={thread.error} className="mt-2 text-sm text-destructive" />}
      </div>
      <ReplyBox feedbackId={feedback.id} />
    </article>
  )
}
