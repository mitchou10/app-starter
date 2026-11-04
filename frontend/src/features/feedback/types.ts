/** The shapes of the feedback module. They follow the planned API, so the mock store can be swapped for it. */

export type Tone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet'

interface Reference {
  id: string
  name: string
  description: string
  tone: Tone
  /** None for the values shipped with the app. */
  createdBy: string | null
  createdAt: string
  /** Archived values stay on existing feedback but are no longer offered. */
  archived: boolean
}

export type FeedbackType = Reference

export interface FeedbackStatus extends Reference {
  /** A closed feedback is in the "closed" list and stops asking for attention. */
  isClosed: boolean
  position: number
}

export interface Attachment {
  id: string
  filename: string
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

export interface Feedback {
  id: string
  title: string
  description: string
  typeId: string
  statusId: string
  createdBy: string
  createdByUsername: string
  createdAt: string
  updatedAt: string
  /** The address of the page the author was on when they opened the form (path and query), or none. */
  page: string | null
  attachments: Attachment[]
  messages: FeedbackMessage[]
}

export interface NewFeedback {
  title: string
  description: string
  typeId: string
  files: File[]
  page: string | null
}

export type ReferenceInput = Pick<Reference, 'name' | 'description' | 'tone'>
