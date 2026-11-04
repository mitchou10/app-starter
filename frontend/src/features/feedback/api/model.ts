/** The feedback module as the screens see it: camelCase, with what the screens need and no more. */

export type Tone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet'

interface Reference {
  id: string
  name: string
  description: string
  tone: Tone
  position: number
  /** Who added it: the account and the name they had then. None for the values shipped with the app. */
  createdBy: string | null
  createdByUsername: string | null
  createdAt: string
  /** Archived values stay on existing feedback but are no longer offered. */
  archived: boolean
}

export type FeedbackType = Reference

export interface FeedbackStatus extends Reference {
  /** The statuses the app itself uses have a key: `new` and `closed`. */
  key: string | null
  /** A closed feedback stops asking for attention. */
  isClosed: boolean
}

export interface Attachment {
  id: string
  filename: string
  contentType: string
  sizeBytes: number
  /** Where the image is served from (the session cookie is enough). */
  url: string
}

export interface FeedbackMessage {
  id: string
  kind: 'comment' | 'status_change'
  body: string
  authorUsername: string
  authorIsStaff: boolean
  createdAt: string
  oldStatusId: string | null
  newStatusId: string | null
  attachments: Attachment[]
}

/** A line of a list: no description, no screenshots. */
export interface FeedbackSummary {
  id: string
  title: string
  typeId: string
  statusId: string
  createdBy: string
  createdByUsername: string
  createdAt: string
  updatedAt: string
  /** Answers only: the changes of status do not count. */
  repliesCount: number
}

export interface Feedback extends Omit<FeedbackSummary, 'repliesCount'> {
  description: string
  /** The page the author was on when they opened the form (path and query), or none. */
  page: string | null
  attachments: Attachment[]
}

export interface NewFeedback {
  title: string
  description: string
  typeId: string
  files: File[]
  page: string | null
}

export interface ReferenceInput {
  name: string
  description: string
  tone: Tone
  isClosed?: boolean
}

/** One page of a list, with how many there are in all. */
export interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface MessagesPage {
  items: FeedbackMessage[]
  total: number
  /** Pass it as `before` to get the older messages; none when there are no more. */
  nextBefore: string | null
}
