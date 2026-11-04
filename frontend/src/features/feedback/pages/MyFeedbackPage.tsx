import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/Container'
import { Button } from '@/components/ui/button'
import { FeedbackWorkspace } from '../components/FeedbackWorkspace'
import { useFeedbackDialog } from '../FeedbackDialogProvider'

/** "My feedback": what the user sent, with the follow-up of the selected one next to it. */
export function MyFeedbackPage() {
  const { t } = useTranslation()
  const { openDialog } = useFeedbackDialog()

  return (
    <Container className="max-w-7xl py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('feedback.list.myTitle')}</h1>
          <p className="text-muted-foreground">{t('feedback.list.myDescription')}</p>
        </div>
        <Button onClick={openDialog}>
          <Plus aria-hidden />
          {t('feedback.list.new')}
        </Button>
      </div>
      <FeedbackWorkspace scope="mine" basePath="/feedback" />
    </Container>
  )
}
