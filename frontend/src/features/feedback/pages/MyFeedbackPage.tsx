import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Section } from '@/components/Section'
import { Button } from '@/components/ui/button'
import { FeedbackDialog } from '../components/FeedbackDialog'
import { FeedbackFilters, NO_FILTER } from '../components/FeedbackFilters'
import { FeedbackTable } from '../components/FeedbackTable'
import { applyFilters } from '../filters'
import { useFeedback } from '../FeedbackProvider'

/** "My feedback": what the user sent, and where it stands. */
export function MyFeedbackPage() {
  const { t } = useTranslation()
  const { mine, statuses } = useFeedback()
  const [filters, setFilters] = useState(NO_FILTER)
  const [dialog, setDialog] = useState(false)

  return (
    <Section className="py-8 sm:py-8">
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
      <div className="mb-4">
        <FeedbackFilters value={filters} onChange={setFilters} />
      </div>
      <FeedbackTable feedbacks={applyFilters(mine, filters, statuses)} />
      <FeedbackDialog open={dialog} onOpenChange={setDialog} />
    </Section>
  )
}
