import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { Attachment } from '../types'

/** The images of a feedback or of a message: thumbnails, each opening full size. */
export function Screenshots({ attachments }: { attachments: Attachment[] }) {
  const { t } = useTranslation()
  if (attachments.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          <Dialog>
            <DialogTrigger
              aria-label={t('feedback.screenshots.open', { name: attachment.filename })}
              className="block overflow-hidden rounded-md border hover:opacity-90"
            >
              <img src={attachment.url} alt={attachment.filename} className="h-20 w-32 object-cover" />
            </DialogTrigger>
            <DialogContent className="max-w-3xl sm:max-w-3xl">
              <DialogTitle className="truncate text-sm">{attachment.filename}</DialogTitle>
              <img src={attachment.url} alt={attachment.filename} className="max-h-[75vh] w-full rounded-md object-contain" />
            </DialogContent>
          </Dialog>
        </li>
      ))}
    </ul>
  )
}
