import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useReferences } from '../api/references'
import { offered } from '../format'
import type { NewFeedback } from '../types'
import { ErrorNotice } from './ErrorNotice'
import { OptionSelect } from './OptionSelect'
import { ScreenshotPicker } from './ScreenshotPicker'

/** Title, description, type and screenshots. Knows nothing about where it is shown (a dialog, a page...). */
interface FeedbackFormProps {
  onSubmit: (feedback: NewFeedback) => void
  onCancel?: () => void
  /** The page the user was on, offered as an attachment. */
  page?: string | null
  /** The request is on its way, or failed: the form shows it and keeps what was typed. */
  pending?: boolean
  error?: unknown
}

export function FeedbackForm({ onSubmit, onCancel, page = null, pending = false, error }: FeedbackFormProps) {
  const { t } = useTranslation()
  const { types } = useReferences()
  const options = offered(types).map((type) => ({ value: type.id, label: type.name }))
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [typeId, setTypeId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [attachPage, setAttachPage] = useState(true)
  const [tried, setTried] = useState(false)

  const missing = { title: !title.trim(), description: !description.trim(), type: !typeId }
  const valid = !missing.title && !missing.description && !missing.type

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        setTried(true)
        if (valid && !pending) onSubmit({ title: title.trim(), description: description.trim(), typeId, files, page: attachPage ? page : null })
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="feedback-title">{t('feedback.form.title')}</Label>
        <Input id="feedback-title" value={title} maxLength={120} aria-invalid={tried && missing.title} onChange={(e) => setTitle(e.target.value)} />
        {tried && missing.title && <p className="text-xs text-destructive">{t('feedback.form.required')}</p>}
      </div>

      <div className="grid gap-2">
        <Label>{t('feedback.form.type')}</Label>
        <OptionSelect value={typeId} onChange={setTypeId} options={options} label={t("feedback.form.type")} placeholder={t("feedback.form.typePlaceholder")} className="w-full" />
        {tried && missing.type && <p className="text-xs text-destructive">{t('feedback.form.required')}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="feedback-description">{t('feedback.form.description')}</Label>
        <Textarea id="feedback-description" rows={5} value={description} aria-invalid={tried && missing.description} onChange={(e) => setDescription(e.target.value)} />
        {tried && missing.description && <p className="text-xs text-destructive">{t('feedback.form.required')}</p>}
      </div>

      <div className="grid gap-2">
        <Label>{t('feedback.form.screenshots')}</Label>
        <ScreenshotPicker files={files} onChange={setFiles} />
      </div>

      {page && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={attachPage} onChange={(event) => setAttachPage(event.target.checked)} />
          <span>
            {t('feedback.form.attachPage')} <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{page}</code>
          </span>
        </label>
      )}

      <ErrorNotice error={error} />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('feedback.form.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {t('feedback.form.submit')}
        </Button>
      </div>
    </form>
  )
}
