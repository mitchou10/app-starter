/** What the backend sends (snake_case). Only the mapper reads it. */
export interface WireNotification {
  id: string
  source: string
  title: string
  description: string
  url: string | null
  created_at: string
  read: boolean
  read_at: string | null
}

export interface WirePage<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}
