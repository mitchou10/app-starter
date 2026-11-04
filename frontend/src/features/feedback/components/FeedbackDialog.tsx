import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useFeedback } from '../FeedbackProvider'
import { FeedbackForm } from './FeedbackForm'

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** "Give feedback": opened from the profile menu or from the list. After sending, goes to the new feedback. */
export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { t } = useTranslation()
  const { create } = useFeedback()
  const navigate = useNavigate()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('feedback.dialog.title')}</DialogTitle>
          <DialogDescription>{t('feedback.dialog.description')}</DialogDescription>
        </DialogHeader>
        <FeedbackForm
          onCancel={() => onOpenChange(false)}
          onSubmit={(input) => {
            const feedback = create(input)
            onOpenChange(false)
            void navigate(`/feedback/${feedback.id}`)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
