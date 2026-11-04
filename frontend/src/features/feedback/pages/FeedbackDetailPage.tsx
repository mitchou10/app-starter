import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { useCurrentUser } from '@/auth/AuthProvider'
import { Section } from '@/components/Section'
import { FeedbackControls } from '../components/FeedbackControls'
import { FeedbackThread } from '../components/FeedbackThread'
import { ReferenceBadge } from '../components/ReferenceBadge'
import { ReplyBox } from '../components/ReplyBox'
import { Screenshots } from '../components/Screenshots'
import { useFeedback } from '../FeedbackProvider'
import { byId, formatDate } from '../format'

/** One feedback with its follow-up. Shared by the author and the admins. */
export function FeedbackDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const { user } = useCurrentUser()
  const { get, types, statuses, reply } = useFeedback()
  const feedback = id ? get(id) : undefined
  // Someone else's feedback looks like it does not exist, unless the viewer is an admin.
  const visible = feedback && (user?.is_admin || feedback.createdBy === user?.user_id)

  if (!feedback || !visible) {
    return (
      <Section className="py-8 text-center sm:py-8">
        <p className="mb-4 text-lg">{t('feedback.detail.notFound')}</p>
        <Link to="/feedback" className="underline">
          {t('feedback.detail.back')}
        </Link>
      </Section>
    )
  }

  const type = byId(types, feedback.typeId)
  const status = byId(statuses, feedback.statusId)

  return (
    <Section className="py-8 sm:py-8">
      <div className="mx-auto grid max-w-3xl gap-6">
        <Link to={user?.is_admin ? '/admin/feedback' : '/feedback'} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft aria-hidden className="size-4" />
          {t('feedback.detail.back')}
        </Link>

        <header className="grid gap-3">
          <h1 className="text-2xl font-semibold">{feedback.title}</h1>
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
      </div>
    </Section>
  )
}
