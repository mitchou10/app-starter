import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFeedback } from '../FeedbackProvider'
import { ReferenceManager } from './ReferenceManager'

/** Admin: the types and the statuses people can choose from. */
export function FeedbackSettings() {
  const { t } = useTranslation()
  const { types, statuses, saveType, saveStatus, setArchived } = useFeedback()

  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground">{t('feedback.admin.settingsDescription')}</p>
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
    </div>
  )
}
