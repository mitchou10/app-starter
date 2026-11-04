import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/features/feedback/format'
import { useSetRead } from '../api/notifications'
import type { Notification } from '../types'
import { NotificationLink } from './NotificationLink'

/** One notification: who emitted it, what it says, where it leads, and whether it was read. */
export function NotificationItem({ notification }: { notification: Notification }) {
  const { t, i18n } = useTranslation()
  const setRead = useSetRead()
  const { id, source, title, description, url, createdAt, read } = notification

  return (
    <li className={cn('flex gap-3 rounded-lg border p-4', !read && 'bg-muted/40')}>
      <span aria-hidden className={cn('mt-2 size-2 shrink-0 rounded-full', read ? 'bg-transparent' : 'bg-destructive')} />
      <div className="grid min-w-0 flex-1 gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {!read && <span className="sr-only">{t('notifications.unreadLabel')}</span>}
          <h3 className={cn('text-sm', read ? 'font-medium' : 'font-semibold')}>{title}</h3>
          <Badge variant="outline">{source}</Badge>
          <time dateTime={createdAt} className="text-xs text-muted-foreground">
            {formatDate(createdAt, i18n.language, true)}
          </time>
        </div>
        {description && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {url && <NotificationLink url={url} onOpen={() => !read && setRead.mutate({ id, read: true })} />}
          <Button variant="ghost" size="sm" disabled={setRead.isPending} onClick={() => setRead.mutate({ id, read: !read })}>
            {read ? t('notifications.markUnread') : t('notifications.markRead')}
          </Button>
        </div>
      </div>
    </li>
  )
}
