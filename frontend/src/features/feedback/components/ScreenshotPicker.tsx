import { ImagePlus, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AVATAR_TYPES } from '@/profile/useAvatar'

export const MAX_SCREENSHOTS = 5
export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024

interface ScreenshotPickerProps {
  files: File[]
  onChange: (files: File[]) => void
}

/** Add images by choosing them or by pasting from the clipboard; shows small previews that can be removed. */
export function ScreenshotPicker({ files, onChange }: ScreenshotPickerProps) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<'tooMany' | 'tooLarge' | 'unsupported' | null>(null)
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files])
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  function add(added: File[]) {
    const kept = [...files]
    let problem: typeof error = null
    for (const file of added) {
      if (!AVATAR_TYPES.includes(file.type)) problem = 'unsupported'
      else if (file.size > MAX_SCREENSHOT_BYTES) problem = 'tooLarge'
      else if (kept.length >= MAX_SCREENSHOTS) problem = 'tooMany'
      else kept.push(file)
    }
    setError(problem)
    onChange(kept)
  }

  // Pasting a screenshot anywhere in the form adds it, which is how most people take one.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const pasted = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith('image/'))
      if (pasted.length) add(pasted)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  })

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="relative size-16 overflow-hidden rounded-md border">
            <img src={previews[index]} alt={file.name} className="size-full object-cover" />
            <button
              type="button"
              aria-label={t('feedback.screenshots.remove', { name: file.name })}
              className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5 hover:bg-background"
              onClick={() => onChange(files.filter((_, i) => i !== index))}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {files.length < MAX_SCREENSHOTS && (
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
            <ImagePlus aria-hidden />
            {t('feedback.screenshots.add')}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t('feedback.screenshots.hint', { max: MAX_SCREENSHOTS })}</p>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {t(`feedback.screenshots.errors.${error}`, { max: MAX_SCREENSHOTS })}
        </p>
      )}
      <input
        ref={input}
        type="file"
        multiple
        accept={AVATAR_TYPES.join(',')}
        aria-label={t('feedback.screenshots.add')}
        className="sr-only"
        onChange={(event) => {
          add(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
    </div>
  )
}
