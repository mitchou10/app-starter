import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useFeedback } from '../FeedbackProvider'
import { FeedbackForm } from './FeedbackForm'

/**
 * "Give feedback", a modal. Mounted once in the app layout (see FeedbackLauncher) and opened with `openDialog()`, from
 * the profile menu, a button or the keyboard shortcut. After sending, goes to the new feedback.
 */
export function FeedbackDialog() {
  const { t } = useTranslation()
  const { dialog, closeDialog, create } = useFeedback()
  const navigate = useNavigate()

  return (
    <Dialog open={dialog.open} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('feedback.dialog.title')}</DialogTitle>
          <DialogDescription>{t('feedback.dialog.description')}</DialogDescription>
        </DialogHeader>
        <FeedbackForm
          page={dialog.page}
          onCancel={closeDialog}
          onSubmit={(input) => {
            const feedback = create(input)
            closeDialog()
            void navigate(`/feedback/${feedback.id}`)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
