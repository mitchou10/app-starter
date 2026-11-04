import type {
  Attachment,
  Feedback,
  FeedbackMessage,
  FeedbackStatus,
  FeedbackSummary,
  FeedbackType,
  MessagesPage,
} from './model'
import type {
  WireAttachment,
  WireFeedback,
  WireMessage,
  WireMessagesPage,
  WireReference,
  WireStatus,
  WireSummary,
} from './wire'

export const toAttachment = (a: WireAttachment): Attachment => ({
  id: a.id,
  filename: a.filename,
  contentType: a.content_type,
  sizeBytes: a.size_bytes,
  url: a.url,
})

export const toType = (r: WireReference): FeedbackType => ({
  id: r.id,
  name: r.name,
  description: r.description,
  tone: r.tone,
  position: r.position,
  createdBy: r.created_by,
  createdByUsername: r.created_by_username,
  createdAt: r.created_at,
  archived: r.archived,
})

export const toStatus = (s: WireStatus): FeedbackStatus => ({ ...toType(s), key: s.key, isClosed: s.is_closed })

export const toSummary = (f: WireSummary): FeedbackSummary => ({
  id: f.id,
  title: f.title,
  typeId: f.type_id,
  statusId: f.status_id,
  createdBy: f.created_by,
  createdByUsername: f.created_by_username,
  createdAt: f.created_at,
  updatedAt: f.updated_at,
  repliesCount: f.replies_count,
})

export const toFeedback = (f: WireFeedback): Feedback => ({
  id: f.id,
  title: f.title,
  typeId: f.type_id,
  statusId: f.status_id,
  createdBy: f.created_by,
  createdByUsername: f.created_by_username,
  createdAt: f.created_at,
  updatedAt: f.updated_at,
  description: f.description,
  page: f.page,
  attachments: f.attachments.map(toAttachment),
})

export const toMessage = (m: WireMessage): FeedbackMessage => ({
  id: m.id,
  kind: m.kind,
  body: m.body,
  authorUsername: m.author_username,
  authorIsStaff: m.author_is_staff,
  createdAt: m.created_at,
  oldStatusId: m.old_status_id,
  newStatusId: m.new_status_id,
  attachments: m.attachments.map(toAttachment),
})

export const toMessagesPage = (p: WireMessagesPage): MessagesPage => ({
  items: p.items.map(toMessage),
  total: p.total,
  nextBefore: p.next_before,
})
