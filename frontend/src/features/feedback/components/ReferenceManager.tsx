import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useArchiveReference, useReferences, useSaveReference } from '../api/references'
import { formatDate } from '../format'
import type { FeedbackStatus, FeedbackType } from '../types'
import { ErrorNotice } from './ErrorNotice'
import { ReferenceBadge } from './ReferenceBadge'
import { ReferenceFormDialog } from './ReferenceFormDialog'

type Item = FeedbackType | FeedbackStatus

/** The list of the types (or of the statuses) with who created each one and when; add, edit, archive. */
export function ReferenceManager({ kind }: { kind: 'type' | 'status' }) {
  const { t, i18n } = useTranslation()
  const { types, statuses } = useReferences()
  const items: Item[] = kind === 'type' ? types : statuses
  const save = useSaveReference(kind)
  const archive = useArchiveReference(kind)
  const [editing, setEditing] = useState<Item | 'new' | null>(null)

  function close(open: boolean) {
    if (open) return
    setEditing(null)
    save.reset() // an old error must not greet the next time
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>
          <Plus aria-hidden />
          {t('feedback.admin.add')}
        </Button>
      </div>
      <ErrorNotice error={archive.error} />
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
                  {'isClosed' in item && item.isClosed && <span className="ml-2 text-xs text-muted-foreground">{t('feedback.admin.closedFlag')}</span>}
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{item.description}</TableCell>
                <TableCell>{item.createdByUsername ?? t('feedback.admin.system')}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(item.createdAt, i18n.language)}</TableCell>
                <TableCell className="space-x-1 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(item)}>
                    {t('feedback.admin.edit')}
                  </Button>
                  <Button variant="ghost" size="sm" disabled={archive.isPending} onClick={() => archive.mutate({ id: item.id, archived: !item.archived })}>
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
        onOpenChange={close}
        item={editing && editing !== 'new' ? editing : undefined}
        withClosed={kind === 'status'}
        saving={save.isPending}
        error={save.error}
        onSave={(input, done) => save.mutate({ input, id: editing && editing !== 'new' ? editing.id : undefined }, { onSuccess: done })}
      />
    </div>
  )
}
