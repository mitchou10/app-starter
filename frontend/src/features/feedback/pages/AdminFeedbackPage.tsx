import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Section } from '@/components/Section'
import { FeedbackFilters, NO_FILTER } from '../components/FeedbackFilters'
import { FeedbackTable } from '../components/FeedbackTable'
import { applyFilters } from '../filters'
import { useFeedback } from '../FeedbackProvider'

/** Admin: every feedback, whoever wrote it. */
export function AdminFeedbackPage() {
  const { t } = useTranslation()
  const { feedbacks, statuses } = useFeedback()
  const [filters, setFilters] = useState({ ...NO_FILTER, status: 'open' })

  return (
    <Section className="py-8 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t('feedback.admin.listTitle')}</h1>
        <p className="text-muted-foreground">{t('feedback.admin.listDescription')}</p>
      </div>
      <div className="mb-4">
        <FeedbackFilters value={filters} onChange={setFilters} />
      </div>
      <FeedbackTable feedbacks={applyFilters(feedbacks, filters, statuses)} showAuthor />
    </Section>
  )
}
