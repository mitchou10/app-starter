/** A notification as the screens see it. */
export interface Notification {
  id: string
  /** The application that emitted it. */
  source: string
  title: string
  description: string
  /** A path of this app (opened in the app) or the address of another application (opened in a new tab); none: no link. */
  url: string | null
  createdAt: string
  read: boolean
}

export type NotificationFilter = 'all' | 'unread'
