import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/auth/AuthProvider'
import { useFeedback } from '../FeedbackProvider'
import { byId, formatDate } from '../format'
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
  const { user } = useCurrentUser()
  const { get, types, statuses, reply } = useFeedback()
  const feedback = get(feedbackId)
  // Someone else's feedback looks like it does not exist, unless the viewer is an admin.
  const visible = feedback && (user?.is_admin || feedback.createdBy === user?.user_id)

  const back = (
    <Link to={listPath} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden">
      <ArrowLeft aria-hidden className="size-4" />
      {t('feedback.detail.back')}
    </Link>
  )

  if (!feedback || !visible) {
    return (
      <div className="grid gap-4">
        {back}
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{t('feedback.detail.notFound')}</p>
      </div>
    )
  }

  const type = byId(types, feedback.typeId)
  const status = byId(statuses, feedback.statusId)

  return (
    <article className="grid gap-6">
      {back}
      <header className="grid gap-3">
        <h2 className="text-2xl font-semibold">{feedback.title}</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {type && <ReferenceBadge name={type.name} tone={type.tone} />}
          {status && <ReferenceBadge name={status.name} tone={status.tone} />}
          <span>{t('feedback.detail.by', { name: feedback.createdByUsername, date: formatDate(feedback.createdAt, i18n.language, true) })}</span>
        </div>
        <FeedbackControls feedback={feedback} />
      </header>

      <div className="grid gap-3 rounded-lg border p-4">
        <p className="whitespace-pre-wrap">{feedback.description}</p>
        <Screenshots attachments={feedback.attachments} />
      </div>

      <FeedbackThread messages={feedback.messages} />
      <ReplyBox onSend={(body, files) => reply(feedback.id, body, files)} />
    </article>
  )
}
