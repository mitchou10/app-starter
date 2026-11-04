import { Badge } from '@/components/ui/badge'

/** The number of unread notifications, in a small badge. Nothing when there are none. */
export function NotificationCount({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <Badge variant="destructive" className={className}>
      {count > 99 ? '99+' : count}
    </Badge>
  )
}
