import { CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/Container'
import { ErrorNotice } from '@/components/ErrorNotice'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMarkAllRead, useNotifications, useUnreadCount } from '../api/notifications'
import { NotificationItem } from '../components/NotificationItem'
import type { NotificationFilter } from '../types'

/** What the applications told me. The same page for a user and for an admin. */
export function NotificationsPage() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const list = useNotifications(filter)
  const unread = useUnreadCount()
  const markAll = useMarkAllRead()
  const remaining = Math.max(list.total - list.items.length, 0)

  return (
    <Container className="max-w-3xl py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('notifications.title')}</h1>
          <p className="text-muted-foreground">{t('notifications.description')}</p>
        </div>
        <Button variant="outline" disabled={unread === 0 || markAll.isPending} onClick={() => markAll.mutate()}>
          <CheckCheck aria-hidden />
          {t('notifications.markAllRead')}
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(next) => setFilter(next as NotificationFilter)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">{t('notifications.tabs.all')}</TabsTrigger>
          <TabsTrigger value="unread">{t('notifications.tabs.unread', { count: unread })}</TabsTrigger>
        </TabsList>
      </Tabs>

      <ErrorNotice error={markAll.error} />
      {list.isLoading && <p className="py-8 text-center text-sm text-muted-foreground">{t('notifications.loading')}</p>}
      {list.isError && <ErrorNotice error={list.error} className="py-8 text-center text-sm text-destructive" />}
      {!list.isLoading && !list.isError && list.items.length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {t(filter === 'unread' ? 'notifications.empty.unread' : 'notifications.empty.all')}
        </p>
      )}
      {list.items.length > 0 && (
        <>
          <ul className="grid gap-3">
            {list.items.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </ul>
          <div className="mt-4 grid justify-items-center gap-2">
            <p className="text-xs text-muted-foreground">{t('notifications.count', { shown: list.items.length, total: list.total })}</p>
            {list.hasMore && (
              <Button variant="outline" size="sm" disabled={list.loadingMore} onClick={list.loadMore}>
                {t('notifications.more', { count: Math.min(remaining, 10) })}
              </Button>
            )}
          </div>
        </>
      )}
    </Container>
  )
}
