import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'

interface NotificationLinkProps {
  url: string
  /** Called when the link is followed: the notification is then read. */
  onOpen: () => void
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/** Where a notification leads: a page of this app, or another application in a new tab. */
export function NotificationLink({ url, onOpen }: NotificationLinkProps) {
  const { t } = useTranslation()
  const className = buttonVariants({ variant: 'outline', size: 'sm' })

  // A path starts with a single "/": the backend and the database refuse anything that is not one of the two kinds.
  if (url.startsWith('/')) {
    return (
      <Link to={url} className={className} onClick={onOpen}>
        {t('notifications.open')}
      </Link>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className} onClick={onOpen}>
      {t('notifications.openOn', { host: hostOf(url) })}
      <ExternalLink aria-hidden />
    </a>
  )
}
