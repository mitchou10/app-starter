import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useReply } from '../api/thread'
import { ErrorNotice } from './ErrorNotice'
import { ScreenshotPicker } from './ScreenshotPicker'

export function ReplyBox({ feedbackId }: { feedbackId: string }) {
  const { t } = useTranslation()
  const reply = useReply(feedbackId)
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])

  return (
    <form
      className="grid shrink-0 gap-2 rounded-lg border p-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!body.trim() || reply.isPending) return
        // Cleared once it is sent: if it fails, what was written is still there to send again.
        reply.mutate(
          { body: body.trim(), files },
          {
            onSuccess: () => {
              setBody('')
              setFiles([])
            },
          },
        )
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
        <Button type="submit" disabled={!body.trim() || reply.isPending}>
          {t('feedback.reply.send')}
        </Button>
      </div>
      <ErrorNotice error={reply.error} />
    </form>
  )
}
