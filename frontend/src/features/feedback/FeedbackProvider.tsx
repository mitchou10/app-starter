import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useCurrentUser } from '@/auth/AuthProvider'
import { buildMockFeedbacks, CLOSED_BY_AUTHOR, DEFAULT_STATUSES, DEFAULT_TYPES, nextId, REOPENED } from './mock/data'
import type {
  Attachment,
  Feedback,
  FeedbackMessage,
  FeedbackStatus,
  FeedbackType,
  NewFeedback,
  ReferenceInput,
} from './types'

interface FeedbackStore {
  types: FeedbackType[]
  statuses: FeedbackStatus[]
  feedbacks: Feedback[]
  /** The feedback the logged-in user wrote. */
  mine: Feedback[]
  get: (id: string) => Feedback | undefined
  create: (input: NewFeedback) => Feedback
  reply: (feedbackId: string, body: string, files: File[]) => void
  changeStatus: (feedbackId: string, statusId: string) => void
  changeType: (feedbackId: string, typeId: string) => void
  /** The author closes or reopens their own feedback. */
  closeByAuthor: (feedbackId: string) => void
  reopenByAuthor: (feedbackId: string) => void
  saveType: (input: ReferenceInput, id?: string) => void
  saveStatus: (input: ReferenceInput & { isClosed: boolean }, id?: string) => void
  setArchived: (kind: 'type' | 'status', id: string, archived: boolean) => void
}

const FeedbackContext = createContext<FeedbackStore | null>(null)

const toAttachments = (files: File[]): Attachment[] =>
  files.map((file) => ({ id: nextId('att'), filename: file.name, url: URL.createObjectURL(file) }))

/**
 * MOCK. Keeps everything in memory so the screens can be tried. Each function here becomes a call to the backend
 * (GET /api/feedback, POST /api/feedback, POST /api/feedback/{id}/messages...): the screens only use this interface.
 */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser()
  const me = useMemo(
    () => ({ id: user?.user_id ?? 'me', username: user?.username || user?.name || 'me', isAdmin: user?.is_admin ?? false }),
    [user],
  )
  const [types, setTypes] = useState(DEFAULT_TYPES)
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES)
  const [feedbacks, setFeedbacks] = useState(() => buildMockFeedbacks(me))

  const now = () => new Date().toISOString()

  const update = useCallback((id: string, change: (feedback: Feedback) => Feedback) => {
    setFeedbacks((all) => all.map((feedback) => (feedback.id === id ? { ...change(feedback), updatedAt: new Date().toISOString() } : feedback)))
  }, [])

  const store = useMemo<FeedbackStore>(() => {
    const statusMessage = (from: string, to: string): FeedbackMessage => ({
      id: nextId('msg'),
      kind: 'status_change',
      body: '',
      authorUsername: me.username,
      authorIsStaff: me.isAdmin,
      createdAt: now(),
      oldStatusId: from,
      newStatusId: to,
      attachments: [],
    })
    const moveTo = (id: string, statusId: string) =>
      update(id, (feedback) =>
        feedback.statusId === statusId
          ? feedback
          : { ...feedback, statusId, messages: [...feedback.messages, statusMessage(feedback.statusId, statusId)] },
      )

    return {
      types,
      statuses,
      feedbacks,
      mine: feedbacks.filter((feedback) => feedback.createdBy === me.id),
      get: (id) => feedbacks.find((feedback) => feedback.id === id),
      create: (input) => {
        const feedback: Feedback = {
          id: nextId('fb'),
          title: input.title,
          description: input.description,
          typeId: input.typeId,
          statusId: REOPENED,
          createdBy: me.id,
          createdByUsername: me.username,
          createdAt: now(),
          updatedAt: now(),
          attachments: toAttachments(input.files),
          messages: [],
        }
        setFeedbacks((all) => [feedback, ...all])
        return feedback
      },
      reply: (feedbackId, body, files) =>
        update(feedbackId, (feedback) => ({
          ...feedback,
          messages: [
            ...feedback.messages,
            {
              id: nextId('msg'),
              kind: 'comment',
              body,
              authorUsername: me.username,
              authorIsStaff: me.isAdmin,
              createdAt: now(),
              oldStatusId: null,
              newStatusId: null,
              attachments: toAttachments(files),
            },
          ],
        })),
      changeStatus: moveTo,
      changeType: (id, typeId) => update(id, (feedback) => ({ ...feedback, typeId })),
      closeByAuthor: (id) => moveTo(id, CLOSED_BY_AUTHOR),
      reopenByAuthor: (id) => moveTo(id, REOPENED),
      saveType: (input, id) =>
        setTypes((all) =>
          id
            ? all.map((type) => (type.id === id ? { ...type, ...input } : type))
            : [...all, { ...input, id: nextId('type'), createdBy: me.username, createdAt: now(), archived: false }],
        ),
      saveStatus: (input, id) =>
        setStatuses((all) =>
          id
            ? all.map((status) => (status.id === id ? { ...status, ...input } : status))
            : [...all, { ...input, id: nextId('status'), position: all.length + 1, createdBy: me.username, createdAt: now(), archived: false }],
        ),
      setArchived: (kind, id, archived) => {
        const set = <T extends { id: string; archived: boolean }>(all: T[]) =>
          all.map((item) => (item.id === id ? { ...item, archived } : item))
        if (kind === 'type') setTypes(set)
        else setStatuses(set)
      },
    }
  }, [types, statuses, feedbacks, me, update])

  return <FeedbackContext.Provider value={store}>{children}</FeedbackContext.Provider>
}

export function useFeedback(): FeedbackStore {
  const context = useContext(FeedbackContext)
  if (!context) throw new Error('useFeedback must be used inside <FeedbackProvider>')
  return context
}
