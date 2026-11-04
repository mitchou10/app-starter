import type { Attachment, Feedback, FeedbackMessage, FeedbackStatus, FeedbackType } from '../types'
import { placeholderScreenshot } from './placeholders'

/** What the first migration will insert. */
export const DEFAULT_TYPES: FeedbackType[] = [
  { id: 'bug', name: 'Bug', description: 'Something does not work as it should.', tone: 'red', createdBy: null, createdAt: '2026-11-01T09:00:00Z', archived: false },
  { id: 'suggestion', name: 'Suggestion', description: 'An idea to improve the app.', tone: 'blue', createdBy: null, createdAt: '2026-11-01T09:00:00Z', archived: false },
  { id: 'question', name: 'Question', description: 'You need help or an explanation.', tone: 'violet', createdBy: null, createdAt: '2026-11-01T09:00:00Z', archived: false },
  { id: 'other', name: 'Other', description: 'Anything else.', tone: 'gray', createdBy: null, createdAt: '2026-11-01T09:00:00Z', archived: false },
]

/** The status an author puts on their own feedback when they close it, and the one it gets back when reopened. */
export const CLOSED_BY_AUTHOR = 'closed'
export const REOPENED = 'new'

export const DEFAULT_STATUSES: FeedbackStatus[] = [
  { id: 'new', name: 'New', description: 'Waiting to be read.', tone: 'blue', isClosed: false, position: 1, createdBy: null, createdAt: '2026-11-01T09:00:00Z', archived: false },
  { id: 'review', name: 'In review', description: 'The team is looking at it.', tone: 'amber', isClosed: false, position: 2, createdBy: null, createdAt: '2026-11-01T09:00:00Z', archived: false },
  { id: 'planned', name: 'Planned', description: 'Accepted, not started yet.', tone: 'violet', isClosed: false, position: 3, createdBy: null, createdAt: '2026-11-01T09:00:00Z', archived: false },
  { id: 'progress', name: 'In progress', description: 'Being worked on.', tone: 'amber', isClosed: false, position: 4, createdBy: null, createdAt: '2026-11-01T09:00:00Z', archived: false },
  { id: 'done', name: 'Done', description: 'Delivered.', tone: 'green', isClosed: true, position: 5, createdBy: null, createdAt: '2026-11-01T09:00:00Z', archived: false },
  { id: 'wontfix', name: "Won't fix", description: 'Refused.', tone: 'gray', isClosed: true, position: 6, createdBy: null, createdAt: '2026-11-01T09:00:00Z', archived: false },
  { id: 'closed', name: 'Closed', description: 'Closed by its author.', tone: 'gray', isClosed: true, position: 7, createdBy: null, createdAt: '2026-11-01T09:00:00Z', archived: false },
]

let counter = 0
export const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

const picture = (label: string, hue: number): Attachment => ({ id: nextId('att'), filename: `${label}.png`, url: placeholderScreenshot(label, hue) })

function message(partial: Partial<FeedbackMessage> & Pick<FeedbackMessage, 'body' | 'authorUsername' | 'createdAt'>): FeedbackMessage {
  return {
    id: nextId('msg'),
    kind: 'comment',
    authorIsStaff: false,
    oldStatusId: null,
    newStatusId: null,
    attachments: [],
    ...partial,
  }
}

/** A back-and-forth of `count` exchanges between the team and the author, to fill a long follow-up. */
function conversation(author: string, count: number): FeedbackMessage[] {
  return Array.from({ length: count }, (_, i) => {
    const hour = String(9 + i).padStart(2, '0')
    return [
      message({ body: `Could you try again after step ${i + 1}: clear the cache, then reload the page?`, authorUsername: 'grace', authorIsStaff: true, createdAt: `2026-11-03T${hour}:00:00Z` }),
      message({ body: `I did step ${i + 1}, the save button still does nothing.`, authorUsername: author, createdAt: `2026-11-03T${hour}:30:00Z` }),
    ]
  }).flat()
}

const COLLEAGUES = [
  { id: 'ada-id', username: 'ada' },
  { id: 'linus-id', username: 'linus' },
  { id: 'margaret-id', username: 'margaret' },
  { id: 'alan-id', username: 'alan' },
]

/**
 * Older feedback, to fill several pages of the list: 9 of the viewer's (closed questions, so they do not disturb the
 * rest of the examples) and 20 from colleagues, in every status. All older than the hand-written ones.
 */
function bulk(me: { id: string; username: string }): Feedback[] {
  const base = { attachments: [] as Attachment[], messages: [] as FeedbackMessage[] }
  const mine = Array.from({ length: 9 }, (_, i): Feedback => ({
    ...base,
    id: `fb-m${i + 1}`,
    title: `Question #${i + 1}: where do I find the old exports?`,
    description: 'I looked in the menu and could not find them.',
    typeId: 'question',
    statusId: 'done',
    createdBy: me.id,
    createdByUsername: me.username,
    createdAt: `2026-10-${String(19 - i).padStart(2, '0')}T09:00:00Z`,
    updatedAt: `2026-10-${String(19 - i).padStart(2, '0')}T10:00:00Z`,
  }))
  const types = ['bug', 'suggestion', 'question', 'other']
  const statuses = ['new', 'review', 'planned', 'progress', 'done']
  const others = Array.from({ length: 20 }, (_, i): Feedback => {
    const who = COLLEAGUES[i % COLLEAGUES.length]
    return {
      ...base,
      id: `fb-o${i + 1}`,
      title: `Feedback from ${who.username} #${i + 1}`,
      description: 'Some details about what happened and what was expected.',
      typeId: types[i % types.length],
      statusId: statuses[i % statuses.length],
      createdBy: who.id,
      createdByUsername: who.username,
      createdAt: `2026-10-${String(28 - (i % 9)).padStart(2, '0')}T08:00:00Z`,
      updatedAt: `2026-10-${String(28 - (i % 9)).padStart(2, '0')}T08:30:00Z`,
    }
  })
  return [...mine, ...others]
}

/** Some feedback for the mockups: the first ones belong to the person looking at them, the others to colleagues. */
export function buildMockFeedbacks(me: { id: string; username: string }): Feedback[] {
  return [...handWritten(me), ...bulk(me)]
}

function handWritten(me: { id: string; username: string }): Feedback[] {
  const base = { updatedAt: '2026-11-03T10:00:00Z', attachments: [] as Attachment[], messages: [] as FeedbackMessage[] }
  return [
    {
      ...base,
      id: 'fb-1',
      title: 'The save button does nothing on the settings page',
      description: 'I click "Save" after changing my name and nothing happens: no message, and the old name is still there after a reload.\n\nHappens on Firefox and Chrome.',
      typeId: 'bug',
      statusId: 'progress',
      createdBy: me.id,
      createdByUsername: me.username,
      createdAt: '2026-11-02T08:30:00Z',
      updatedAt: '2026-11-04T09:12:00Z',
      attachments: [picture('settings-page', 12), picture('console-error', 200)],
      messages: [
        message({ kind: 'status_change', body: '', authorUsername: 'grace', authorIsStaff: true, createdAt: '2026-11-02T10:00:00Z', oldStatusId: 'new', newStatusId: 'review' }),
        message({ body: 'Thanks for the report. Which browser version are you on?', authorUsername: 'grace', authorIsStaff: true, createdAt: '2026-11-02T10:05:00Z' }),
        message({ body: 'Firefox 132 and Chrome 130. Here is the console.', authorUsername: me.username, createdAt: '2026-11-02T11:20:00Z', attachments: [picture('console', 300)] }),
        ...conversation(me.username, 7),
        message({ body: 'Found it, a request fails silently. Fixing it.', authorUsername: 'grace', authorIsStaff: true, createdAt: '2026-11-04T09:10:00Z' }),
        message({ kind: 'status_change', body: '', authorUsername: 'grace', authorIsStaff: true, createdAt: '2026-11-04T09:12:00Z', oldStatusId: 'review', newStatusId: 'progress' }),
      ],
    },
    {
      ...base,
      id: 'fb-2',
      title: 'Dark mode',
      description: 'It would be nice to have a dark theme, at least following the system setting.',
      typeId: 'suggestion',
      statusId: 'planned',
      createdBy: me.id,
      createdByUsername: me.username,
      createdAt: '2026-10-28T14:00:00Z',
      updatedAt: '2026-11-01T16:00:00Z',
      messages: [
        message({ body: 'Good idea, it is on the roadmap for next month.', authorUsername: 'grace', authorIsStaff: true, createdAt: '2026-11-01T15:59:00Z' }),
        message({ kind: 'status_change', body: '', authorUsername: 'grace', authorIsStaff: true, createdAt: '2026-11-01T16:00:00Z', oldStatusId: 'new', newStatusId: 'planned' }),
      ],
    },
    {
      ...base,
      id: 'fb-3',
      title: 'How do I change the language?',
      description: 'I cannot find where to switch to French.',
      typeId: 'question',
      statusId: 'done',
      createdBy: me.id,
      createdByUsername: me.username,
      createdAt: '2026-10-20T09:00:00Z',
      updatedAt: '2026-10-20T09:30:00Z',
      messages: [
        message({ body: 'Open the menu at the bottom of the sidebar, then *Language*.', authorUsername: 'grace', authorIsStaff: true, createdAt: '2026-10-20T09:25:00Z' }),
        message({ kind: 'status_change', body: '', authorUsername: 'grace', authorIsStaff: true, createdAt: '2026-10-20T09:30:00Z', oldStatusId: 'new', newStatusId: 'done' }),
      ],
    },
    {
      ...base,
      id: 'fb-4',
      title: 'Export my data as CSV',
      description: 'We need to export the list to a spreadsheet every week.',
      typeId: 'suggestion',
      statusId: 'new',
      createdBy: 'ada-id',
      createdByUsername: 'ada',
      createdAt: '2026-11-04T07:45:00Z',
      updatedAt: '2026-11-04T07:45:00Z',
    },
    {
      ...base,
      id: 'fb-5',
      title: 'Photo upload fails with a large image',
      description: 'A 6 MB photo is refused with no clear reason.',
      typeId: 'bug',
      statusId: 'review',
      createdBy: 'linus-id',
      createdByUsername: 'linus',
      createdAt: '2026-11-03T16:10:00Z',
      updatedAt: '2026-11-03T17:00:00Z',
      attachments: [picture('upload-error', 30)],
      messages: [
        message({ kind: 'status_change', body: '', authorUsername: 'grace', authorIsStaff: true, createdAt: '2026-11-03T17:00:00Z', oldStatusId: 'new', newStatusId: 'review' }),
      ],
    },
  ]
}
