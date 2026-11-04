import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { FeedbackStatus, FeedbackType, ReferenceInput, Tone } from '../types'
import { ErrorNotice } from '@/components/ErrorNotice'
import { OptionSelect } from './OptionSelect'
import { TONES } from './tone'

type Item = FeedbackType | FeedbackStatus

interface ReferenceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The item being edited, or none to add one. */
  item?: Item
  /** Statuses have a "closed" flag, types do not. */
  withClosed: boolean
  /** Saves, and calls `done` once it worked: the dialog stays open, with the error, when it did not. */
  onSave: (input: ReferenceInput, done: () => void) => void
  saving?: boolean
  error?: unknown
}

export function ReferenceFormDialog(props: ReferenceFormDialogProps) {
  // Remounted each time it opens, so the fields start from the item (or empty).
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>{props.open && <Form {...props} />}</DialogContent>
    </Dialog>
  )
}

function Form({ onOpenChange, item, withClosed, onSave, saving = false, error }: ReferenceFormDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [tone, setTone] = useState<Tone>(item?.tone ?? 'gray')
  const [isClosed, setIsClosed] = useState(item && 'isClosed' in item ? item.isClosed : false)

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!name.trim() || saving) return
        onSave({ name: name.trim(), description: description.trim(), tone, ...(withClosed ? { isClosed } : {}) }, () => onOpenChange(false))
      }}
    >
      <DialogHeader>
        <DialogTitle>{item ? t('feedback.admin.edit') : t('feedback.admin.add')}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="reference-name">{t('feedback.admin.name')}</Label>
        <Input id="reference-name" value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="reference-description">{t('feedback.admin.description')}</Label>
        <Textarea id="reference-description" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label>{t('feedback.admin.color')}</Label>
        <OptionSelect
          label={t('feedback.admin.color')}
          value={tone}
          onChange={(value) => setTone(value as Tone)}
          options={TONES.map((value) => ({ value, label: t(`feedback.tones.${value}`) }))}
        />
      </div>
      {withClosed && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isClosed} onChange={(event) => setIsClosed(event.target.checked)} />
          {t('feedback.admin.isClosed')}
        </label>
      )}
      <ErrorNotice error={error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          {t('feedback.form.cancel')}
        </Button>
        <Button type="submit" disabled={saving}>
          {t('feedback.admin.save')}
        </Button>
      </div>
    </form>
  )
}
