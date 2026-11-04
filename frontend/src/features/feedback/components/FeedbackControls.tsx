import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { useChangeFeedback } from '../api/detail'
import { useReferences } from '../api/references'
import { byId, offered } from '../format'
import type { Feedback } from '../types'
import { ErrorNotice } from '@/components/ErrorNotice'
import { OptionSelect } from './OptionSelect'

/**
 * Admins change the status and the type. The author can only close their feedback, or reopen it:
 * they decide whether their own question is answered, not how the team organizes its work.
 */
export function FeedbackControls({ feedback }: { feedback: Feedback }) {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const { types, statuses } = useReferences()
  const change = useChangeFeedback(feedback.id)

  if (user?.is_admin) {
    return (
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <OptionSelect
            label={t('feedback.controls.status')}
            value={feedback.statusId}
            onChange={(statusId) => change.mutate({ statusId })}
            options={offered(statuses, feedback.statusId).map((s) => ({ value: s.id, label: s.name }))}
            className="w-48"
          />
          <OptionSelect
            label={t('feedback.controls.type')}
            value={feedback.typeId}
            onChange={(typeId) => change.mutate({ typeId })}
            options={offered(types, feedback.typeId).map((x) => ({ value: x.id, label: x.name }))}
            className="w-44"
          />
        </div>
        <ErrorNotice error={change.error} />
      </div>
    )
  }

  if (feedback.createdBy !== user?.user_id) return null
  const closed = byId(statuses, feedback.statusId)?.isClosed
  // The statuses the app itself uses are found by their key, not by their name: an admin may rename them.
  const target = statuses.find((s) => s.key === (closed ? 'new' : 'closed'))
  return (
    <div className="grid gap-2">
      <div>
        <Button variant="outline" disabled={!target || change.isPending} onClick={() => target && change.mutate({ statusId: target.id })}>
          {closed ? t('feedback.controls.reopen') : t('feedback.controls.close')}
        </Button>
      </div>
      <ErrorNotice error={change.error} />
    </div>
  )
}
