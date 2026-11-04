import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/Container'
import { Button } from '@/components/ui/button'
import { FeedbackDialog } from '../components/FeedbackDialog'
import { FeedbackWorkspace } from '../components/FeedbackWorkspace'
import { useFeedback } from '../FeedbackProvider'

/** "My feedback": what the user sent, with the follow-up of the selected one next to it. */
export function MyFeedbackPage() {
  const { t } = useTranslation()
  const { mine } = useFeedback()
  const [dialog, setDialog] = useState(false)

  return (
    <Container className="max-w-7xl py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('feedback.list.myTitle')}</h1>
          <p className="text-muted-foreground">{t('feedback.list.myDescription')}</p>
        </div>
        <Button onClick={() => setDialog(true)}>
          <Plus aria-hidden />
          {t('feedback.list.new')}
        </Button>
      </div>
      <FeedbackWorkspace feedbacks={mine} basePath="/feedback" />
      <FeedbackDialog open={dialog} onOpenChange={setDialog} />
    </Container>
  )
}
