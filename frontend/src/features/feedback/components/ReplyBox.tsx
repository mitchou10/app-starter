import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScreenshotPicker } from './ScreenshotPicker'

export function ReplyBox({ onSend }: { onSend: (body: string, files: File[]) => void }) {
  const { t } = useTranslation()
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])

  return (
    <form
      className="grid gap-3 rounded-lg border p-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!body.trim()) return
        onSend(body.trim(), files)
        setBody('')
        setFiles([])
      }}
    >
      <Label htmlFor="reply">{t('feedback.reply.label')}</Label>
      <Textarea id="reply" rows={3} value={body} onChange={(event) => setBody(event.target.value)} />
      <ScreenshotPicker files={files} onChange={setFiles} />
      <div className="flex justify-end">
        <Button type="submit" disabled={!body.trim()}>
          {t('feedback.reply.send')}
        </Button>
      </div>
    </form>
  )
}
