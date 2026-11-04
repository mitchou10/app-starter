import { useTranslation } from 'react-i18next'
import { Section } from '@/components/Section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReferenceManager } from '../components/ReferenceManager'
import { useFeedback } from '../FeedbackProvider'

/** Admin: the types and the statuses people can choose from. */
export function AdminFeedbackSettingsPage() {
  const { t } = useTranslation()
  const { types, statuses, saveType, saveStatus, setArchived } = useFeedback()

  return (
    <Section className="py-8 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t('feedback.admin.settingsTitle')}</h1>
        <p className="text-muted-foreground">{t('feedback.admin.settingsDescription')}</p>
      </div>
      <Tabs defaultValue="types">
        <TabsList>
          <TabsTrigger value="types">{t('feedback.admin.types')}</TabsTrigger>
          <TabsTrigger value="statuses">{t('feedback.admin.statuses')}</TabsTrigger>
        </TabsList>
        <TabsContent value="types" className="mt-4">
          <ReferenceManager
            items={types}
            onSave={(input, id) => saveType({ name: input.name, description: input.description, tone: input.tone }, id)}
            onArchive={(id, archived) => setArchived('type', id, archived)}
          />
        </TabsContent>
        <TabsContent value="statuses" className="mt-4">
          <ReferenceManager
            items={[...statuses].sort((a, b) => a.position - b.position)}
            withClosed
            onSave={(input, id) => saveStatus(input, id)}
            onArchive={(id, archived) => setArchived('status', id, archived)}
          />
        </TabsContent>
      </Tabs>
    </Section>
  )
}
