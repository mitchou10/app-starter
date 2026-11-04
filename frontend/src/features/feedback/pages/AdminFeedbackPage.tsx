import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Container } from '@/components/Container'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FeedbackSettings } from '../components/FeedbackSettings'
import { FeedbackWorkspace } from '../components/FeedbackWorkspace'
import { NO_FILTER } from '../components/FeedbackFilters'
import { useFeedback } from '../FeedbackProvider'

const BASE = '/admin/feedback'

/** Admin: every feedback with its follow-up, and (second tab) the types and statuses. One page. */
export function AdminFeedbackPage({ view }: { view: 'feedback' | 'settings' }) {
  const { t } = useTranslation()
  const { feedbacks } = useFeedback()
  const navigate = useNavigate()

  return (
    <Container className="max-w-7xl py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('feedback.admin.pageTitle')}</h1>
          <p className="text-muted-foreground">{t('feedback.admin.pageDescription')}</p>
        </div>
        <Tabs value={view} onValueChange={(next) => void navigate(next === 'settings' ? `${BASE}/settings` : BASE)}>
          <TabsList>
            <TabsTrigger value="feedback">{t('feedback.admin.tabFeedback')}</TabsTrigger>
            <TabsTrigger value="settings">{t('feedback.admin.tabSettings')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {view === 'feedback' ? (
        <FeedbackWorkspace feedbacks={feedbacks} basePath={BASE} showAuthor initialFilters={{ ...NO_FILTER, status: 'open' }} />
      ) : (
        <FeedbackSettings />
      )}
    </Container>
  )
}
