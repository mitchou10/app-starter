import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScreenshotPicker } from './ScreenshotPicker'

export function ReplyBox({ onSend }: { onSend: (body: string, files: File[]) => void }) {
  const { t } = useTranslation()
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])

  return (
    <form
      className="grid shrink-0 gap-2 rounded-lg border p-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!body.trim()) return
        onSend(body.trim(), files)
        setBody('')
        setFiles([])
      }}
    >
      <Textarea
        id="reply"
        rows={2}
        aria-label={t('feedback.reply.label')}
        placeholder={t('feedback.reply.label')}
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <div className="flex items-start justify-between gap-3">
        <ScreenshotPicker files={files} onChange={setFiles} />
        <Button type="submit" disabled={!body.trim()}>
          {t('feedback.reply.send')}
        </Button>
      </div>
    </form>
  )
}
