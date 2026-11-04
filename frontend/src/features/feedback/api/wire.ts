/** The shapes the backend sends (snake_case). Only the mappers read them. */

import type { Tone } from '../types'

export interface WireAttachment {
  id: string
  filename: string
  content_type: string
  size_bytes: number
  url: string
}

export interface WireReference {
  id: string
  name: string
  description: string
  tone: Tone
  position: number
  created_by: string | null
  created_by_username: string | null
  created_at: string
  archived: boolean
}

export interface WireStatus extends WireReference {
  key: string | null
  is_closed: boolean
}

export interface WireSummary {
  id: string
  title: string
  type_id: string
  status_id: string
  created_by: string
  created_by_username: string
  created_at: string
  updated_at: string
  replies_count: number
}

export interface WireFeedback extends Omit<WireSummary, 'replies_count'> {
  description: string
  page: string | null
  attachments: WireAttachment[]
}

export interface WireMessage {
  id: string
  kind: 'comment' | 'status_change'
  body: string
  author_username: string
  author_is_staff: boolean
  created_at: string
  old_status_id: string | null
  new_status_id: string | null
  attachments: WireAttachment[]
}

export interface WirePage<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface WireMessagesPage {
  items: WireMessage[]
  total: number
  next_before: string | null
}
