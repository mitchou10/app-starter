import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReferenceManager } from './ReferenceManager'

/** Admin: the types and the statuses people can choose from. */
export function FeedbackSettings() {
  const { t } = useTranslation()

  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground">{t('feedback.admin.settingsDescription')}</p>
      <Tabs defaultValue="types">
        <TabsList>
          <TabsTrigger value="types">{t('feedback.admin.types')}</TabsTrigger>
          <TabsTrigger value="statuses">{t('feedback.admin.statuses')}</TabsTrigger>
        </TabsList>
        <TabsContent value="types" className="mt-4">
          <ReferenceManager kind="type" />
        </TabsContent>
        <TabsContent value="statuses" className="mt-4">
          <ReferenceManager kind="status" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
