import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '../format'
import type { FeedbackStatus, FeedbackType, ReferenceInput } from '../types'
import { ReferenceBadge } from './ReferenceBadge'
import { ReferenceFormDialog } from './ReferenceFormDialog'

type Item = FeedbackType | FeedbackStatus

interface ReferenceManagerProps {
  items: Item[]
  /** Statuses have a "closed" flag, types do not. */
  withClosed?: boolean
  onSave: (input: ReferenceInput & { isClosed: boolean }, id?: string) => void
  onArchive: (id: string, archived: boolean) => void
}

/** The list of the types (or of the statuses) with who created each one and when; add, edit, archive. */
export function ReferenceManager({ items, withClosed = false, onSave, onArchive }: ReferenceManagerProps) {
  const { t, i18n } = useTranslation()
  const [editing, setEditing] = useState<Item | 'new' | null>(null)

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>
          <Plus aria-hidden />
          {t('feedback.admin.add')}
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('feedback.admin.name')}</TableHead>
              <TableHead>{t('feedback.admin.description')}</TableHead>
              <TableHead>{t('feedback.admin.createdBy')}</TableHead>
              <TableHead>{t('feedback.admin.createdAt')}</TableHead>
              <TableHead className="text-right">{t('feedback.admin.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className={item.archived ? 'opacity-50' : undefined}>
                <TableCell>
                  <ReferenceBadge name={item.name} tone={item.tone} />
                  {'isClosed' in item && item.isClosed && (
                    <span className="ml-2 text-xs text-muted-foreground">{t('feedback.admin.closedFlag')}</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{item.description}</TableCell>
                <TableCell>{item.createdBy ?? t('feedback.admin.system')}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(item.createdAt, i18n.language)}</TableCell>
                <TableCell className="space-x-1 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(item)}>
                    {t('feedback.admin.edit')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onArchive(item.id, !item.archived)}>
                    {item.archived ? t('feedback.admin.restore') : t('feedback.admin.archive')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ReferenceFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        item={editing && editing !== 'new' ? editing : undefined}
        withClosed={withClosed}
        onSave={(input) => onSave(input, editing && editing !== 'new' ? editing.id : undefined)}
      />
    </div>
  )
}
