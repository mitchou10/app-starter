import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/UserAvatar'
import { useFeedback } from '../FeedbackProvider'
import { byId, formatDate } from '../format'
import type { FeedbackMessage } from '../types'
import { ReferenceBadge } from './ReferenceBadge'
import { Screenshots } from './Screenshots'

/** One line of the follow-up: an answer, or a change of status. */
export function ThreadItem({ message }: { message: FeedbackMessage }) {
  const { t, i18n } = useTranslation()
  const { statuses } = useFeedback()
  const when = formatDate(message.createdAt, i18n.language, true)

  if (message.kind === 'status_change') {
    const from = message.oldStatusId ? byId(statuses, message.oldStatusId) : undefined
    const to = message.newStatusId ? byId(statuses, message.newStatusId) : undefined
    return (
      <li className="flex flex-wrap items-center justify-center gap-2 py-1 text-sm text-muted-foreground">
        <span>{t('feedback.thread.statusChanged', { name: message.authorUsername })}</span>
        {from && <ReferenceBadge name={from.name} tone={from.tone} />}
        <span aria-hidden>→</span>
        {to && <ReferenceBadge name={to.name} tone={to.tone} />}
        <span>· {when}</span>
      </li>
    )
  }

  return (
    <li className="flex gap-3">
      <UserAvatar user={{ name: message.authorUsername, username: message.authorUsername, email: '' }} className="size-8" />
      <div className="grid min-w-0 flex-1 gap-2 rounded-lg border p-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{message.authorUsername}</span>
          {message.authorIsStaff && <Badge variant="outline">{t('feedback.thread.staff')}</Badge>}
          <span className="text-muted-foreground">{when}</span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
        <Screenshots attachments={message.attachments} />
      </div>
    </li>
  )
}
