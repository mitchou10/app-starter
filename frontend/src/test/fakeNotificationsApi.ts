/** The notifications API in memory, with the rules of the real one: the user's own, newest first, by pages. */
import type { WireNotification } from '@/features/notifications/api/wire'
import { Reply } from './fakeFeedbackApi'

export type SeedNotification = Partial<WireNotification> & Pick<WireNotification, 'title'>

export interface FakeNotificationsApi {
  handle: (url: string, init?: RequestInit) => Reply | unknown
  /** What the server holds. */
  notifications: WireNotification[]
  /** An application tells this user something, now. */
  emit: (notification: SeedNotification) => WireNotification
}

let counter = 0

export function createFakeNotificationsApi(signedIn: boolean, seed: SeedNotification[] = []): FakeNotificationsApi {
  const notifications: WireNotification[] = []
  let clock = Date.parse('2026-11-01T09:00:00Z')

  function emit(input: SeedNotification): WireNotification {
    clock += 60_000
    const read = input.read ?? false
    const notification: WireNotification = {
      id: `notification-${++counter}`,
      source: 'billing',
      description: '',
      url: null,
      created_at: new Date(clock).toISOString(),
      read_at: read ? new Date(clock).toISOString() : null,
      ...input,
      read,
    }
    notifications.push(notification)
    return notification
  }
  seed.forEach(emit)

  const unread = () => notifications.filter((n) => !n.read)

  function handle(url: string, init: RequestInit = {}): Reply | unknown {
    if (!signedIn) return new Reply(401, { detail: 'Not authenticated' })
    const [path, query = ''] = url.split('?')
    const params = new URLSearchParams(query)
    const method = (init.method ?? 'GET').toUpperCase()

    if (path === '/api/notifications/unread-count') return { count: unread().length }
    if (path === '/api/notifications/read-all' && method === 'POST') {
      const now = new Date().toISOString()
      const toRead = unread()
      toRead.forEach((n) => Object.assign(n, { read: true, read_at: now }))
      return { updated: toRead.length }
    }
    if (path === '/api/notifications') {
      const limit = Number(params.get('limit') ?? 10)
      const offset = Number(params.get('offset') ?? 0)
      const all = (params.get('unread') === 'true' ? unread() : [...notifications]).sort(
        (a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id),
      )
      return { items: all.slice(offset, offset + limit), total: all.length, limit, offset }
    }
    const one = path.match(/^\/api\/notifications\/([^/]+)$/)
    if (one && method === 'PATCH') {
      const found = notifications.find((n) => n.id === one[1])
      if (!found) return new Reply(404, { detail: 'This notification does not exist' })
      const { read } = JSON.parse(String(init.body)) as { read: boolean }
      if (read && !found.read) Object.assign(found, { read: true, read_at: new Date().toISOString() })
      if (!read) Object.assign(found, { read: false, read_at: null })
      return found
    }
    return undefined
  }

  return { handle, notifications, emit }
}
