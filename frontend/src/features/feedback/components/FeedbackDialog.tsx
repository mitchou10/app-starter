import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCreateFeedback } from '../api/create'
import { useFeedbackDialog } from '../FeedbackDialogProvider'
import { FeedbackForm } from './FeedbackForm'

/**
 * "Give feedback", a modal. Mounted once in the app layout (see FeedbackLauncher) and opened with `openDialog()`, from
 * the profile menu, a button or the keyboard shortcut. After sending, goes to the new feedback.
 */
export function FeedbackDialog() {
  const { t } = useTranslation()
  const { open, page, closeDialog } = useFeedbackDialog()
  const create = useCreateFeedback()
  const navigate = useNavigate()

  function close() {
    closeDialog()
    create.reset() // an old error must not greet the next time
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('feedback.dialog.title')}</DialogTitle>
          <DialogDescription>{t('feedback.dialog.description')}</DialogDescription>
        </DialogHeader>
        <FeedbackForm
          page={page}
          pending={create.isPending}
          error={create.error}
          onCancel={close}
          onSubmit={(input) =>
            create.mutate(input, {
              onSuccess: (feedback) => {
                close()
                void navigate(`/feedback/${feedback.id}`)
              },
            })
          }
        />
      </DialogContent>
    </Dialog>
  )
}
