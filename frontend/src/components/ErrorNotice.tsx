import { useTranslation } from 'react-i18next'
import { errorKind } from '@/lib/errors'

/** What went wrong, in a sentence, for any error of the API (or of the network). Nothing when there is none. */
export function ErrorNotice({ error, className }: { error: unknown; className?: string }) {
  const { t } = useTranslation()
  if (!error) return null
  return (
    <p role="alert" className={className ?? 'text-sm text-destructive'}>
      {t(`errors.${errorKind(error)}`)}
    </p>
  )
}
