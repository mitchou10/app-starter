/**
 * A backend for the tests: the feedback API in memory, with the rules of the real one (who sees what, who may change
 * what, filters, pages, cursors). The screens are tested against it, the real backend against its own tests.
 */
import type { WireAttachment, WireFeedback, WireMessage, WireReference, WireStatus } from '@/features/feedback/api/wire'

/** What a route answers when it is not a plain body: a status, and optionally a body. */
export class Reply {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown = {}) {
    this.status = status
    this.body = body
  }
}

const fail = (status: number, detail: string) => new Reply(status, { detail })

export interface FakeUser {
  user_id: string
  username: string
  name: string
  is_admin: boolean
}

interface Stored extends WireFeedback {
  messages: WireMessage[]
}

const T = '2026-11-01T09:00:00Z'
const type = (id: string, name: string, description: string, tone: WireReference['tone'], position: number): WireReference => ({
  id, name, description, tone, position, created_by: null, created_by_username: null, created_at: T, archived: false,
})
const status = (
  key: string, name: string, description: string, tone: WireReference['tone'], position: number, closed: boolean,
): WireStatus => ({ ...type(key, name, description, tone, position), key, is_closed: closed })

const seedTypes = () => [
  type('bug', 'Bug', 'Something does not work as it should.', 'red', 1),
  type('suggestion', 'Suggestion', 'An idea to improve the app.', 'blue', 2),
  type('question', 'Question', 'You need help or an explanation.', 'violet', 3),
  type('other', 'Other', 'Anything else.', 'gray', 4),
]
const seedStatuses = () => [
  status('new', 'New', 'Waiting to be read.', 'blue', 1, false),
  status('review', 'In review', 'The team is looking at it.', 'amber', 2, false),
  status('planned', 'Planned', 'Accepted, not started yet.', 'violet', 3, false),
  status('progress', 'In progress', 'Being worked on.', 'amber', 4, false),
  status('done', 'Done', 'Delivered.', 'green', 5, true),
  status('wontfix', "Won't fix", 'Refused.', 'gray', 6, true),
  status('closed', 'Closed', 'Closed by its author.', 'gray', 7, true),
]

let counter = 0
const nextId = (prefix: string) => `${prefix}-${++counter}`

const picture = (feedbackId: string, filename: string): WireAttachment => {
  const id = nextId('att')
  return { id, filename, content_type: 'image/png', size_bytes: 1234, url: `/api/feedback/${feedbackId}/attachments/${id}` }
}

function message(partial: Partial<WireMessage> & Pick<WireMessage, 'body' | 'author_username' | 'created_at'>): WireMessage {
  return {
    id: nextId('msg'), kind: 'comment', author_is_staff: false, old_status_id: null, new_status_id: null, attachments: [], ...partial,
  }
}
const change = (who: string, at: string, from: string, to: string) =>
  message({ kind: 'status_change', body: '', author_username: who, author_is_staff: true, created_at: at, old_status_id: from, new_status_id: to })

/** The examples: the first feedback belongs to the person looking at it, the others to colleagues. */
function seedFeedback(me: FakeUser): Stored[] {
  const base = { description: 'Some details.', page: null, attachments: [] as WireAttachment[], messages: [] as WireMessage[] }
  const mine = { created_by: me.user_id, created_by_username: me.username }
  const conversation = Array.from({ length: 7 }, (_, i) => {
    const hour = String(9 + i).padStart(2, '0')
    return [
      message({ body: `Could you try again after step ${i + 1}: clear the cache, then reload the page?`, author_username: 'grace', author_is_staff: true, created_at: `2026-11-03T${hour}:00:00Z` }),
      message({ body: `I did step ${i + 1}, the save button still does nothing.`, author_username: me.username, created_at: `2026-11-03T${hour}:30:00Z` }),
    ]
  }).flat()

  const fb1: Stored = {
    ...base, ...mine, id: 'fb-1', title: 'The save button does nothing on the settings page',
    description: 'I click "Save" after changing my name and nothing happens.\n\nHappens on Firefox and Chrome.',
    type_id: 'bug', status_id: 'progress', page: '/settings', created_at: '2026-11-02T08:30:00Z', updated_at: '2026-11-04T09:12:00Z',
    attachments: [picture('fb-1', 'settings-page.png'), picture('fb-1', 'console-error.png')],
    messages: [
      change('grace', '2026-11-02T10:00:00Z', 'new', 'review'),
      message({ body: 'Thanks for the report. Which browser version are you on?', author_username: 'grace', author_is_staff: true, created_at: '2026-11-02T10:05:00Z' }),
      message({ body: 'Firefox 132 and Chrome 130. Here is the console.', author_username: me.username, created_at: '2026-11-02T11:20:00Z', attachments: [picture('fb-1', 'console.png')] }),
      ...conversation,
      message({ body: 'Found it, a request fails silently. Fixing it.', author_username: 'grace', author_is_staff: true, created_at: '2026-11-04T09:10:00Z' }),
      change('grace', '2026-11-04T09:12:00Z', 'review', 'progress'),
    ],
  }
  const fb2: Stored = {
    ...base, ...mine, id: 'fb-2', title: 'Dark mode', description: 'It would be nice to have a dark theme.',
    type_id: 'suggestion', status_id: 'planned', created_at: '2026-10-28T14:00:00Z', updated_at: '2026-11-01T16:00:00Z',
    messages: [
      message({ body: 'Good idea, it is on the roadmap for next month.', author_username: 'grace', author_is_staff: true, created_at: '2026-11-01T15:59:00Z' }),
      change('grace', '2026-11-01T16:00:00Z', 'new', 'planned'),
    ],
  }
  const fb3: Stored = {
    ...base, ...mine, id: 'fb-3', title: 'How do I change the language?', description: 'I cannot find where to switch to French.',
    type_id: 'question', status_id: 'done', created_at: '2026-10-20T09:00:00Z', updated_at: '2026-10-20T09:30:00Z',
    messages: [
      message({ body: 'Open the menu at the bottom of the sidebar, then Language.', author_username: 'grace', author_is_staff: true, created_at: '2026-10-20T09:25:00Z' }),
      change('grace', '2026-10-20T09:30:00Z', 'new', 'done'),
    ],
  }
  const fb4: Stored = {
    ...base, id: 'fb-4', created_by: 'ada-id', created_by_username: 'ada', title: 'Export my data as CSV',
    description: 'We need to export the list to a spreadsheet every week.', type_id: 'suggestion', status_id: 'new',
    page: '/feedback?tab=exports', created_at: '2026-11-04T07:45:00Z', updated_at: '2026-11-04T07:45:00Z',
  }
  const fb5: Stored = {
    ...base, id: 'fb-5', created_by: 'linus-id', created_by_username: 'linus', title: 'Photo upload fails with a large image',
    description: 'A 6 MB photo is refused with no clear reason.', type_id: 'bug', status_id: 'review',
    created_at: '2026-11-03T16:10:00Z', updated_at: '2026-11-03T17:00:00Z', attachments: [picture('fb-5', 'upload-error.png')],
    messages: [change('grace', '2026-11-03T17:00:00Z', 'new', 'review')],
  }
  // Older ones, to fill several pages: 9 of the viewer's (closed questions) and 20 from colleagues.
  const olderMine = Array.from({ length: 9 }, (_, i): Stored => ({
    ...base, ...mine, id: `fb-m${i + 1}`, title: `Question #${i + 1}: where do I find the old exports?`, type_id: 'question', status_id: 'done',
    created_at: `2026-10-${String(19 - i).padStart(2, '0')}T09:00:00Z`, updated_at: `2026-10-${String(19 - i).padStart(2, '0')}T10:00:00Z`,
  }))
  const colleagues = ['ada', 'linus', 'margaret', 'alan']
  const types = ['bug', 'suggestion', 'question', 'other']
  const statuses = ['new', 'review', 'planned', 'progress', 'done']
  const others = Array.from({ length: 20 }, (_, i): Stored => ({
    ...base, id: `fb-o${i + 1}`, created_by: `${colleagues[i % 4]}-id`, created_by_username: colleagues[i % 4],
    title: `Feedback from ${colleagues[i % 4]} #${i + 1}`, type_id: types[i % 4], status_id: statuses[i % 5],
    created_at: `2026-10-${String(28 - (i % 9)).padStart(2, '0')}T08:00:00Z`, updated_at: `2026-10-${String(28 - (i % 9)).padStart(2, '0')}T08:30:00Z`,
  }))
  return [fb1, fb2, fb3, fb4, fb5, ...olderMine, ...others]
}

const summary = (f: Stored) => ({
  id: f.id, title: f.title, type_id: f.type_id, status_id: f.status_id, created_by: f.created_by,
  created_by_username: f.created_by_username, created_at: f.created_at, updated_at: f.updated_at,
  replies_count: f.messages.filter((m) => m.kind === 'comment').length,
})
const detail = ({ messages: _messages, ...feedback }: Stored): WireFeedback => feedback

export interface FakeApi {
  handle: (url: string, init?: RequestInit) => Reply | unknown
  /** What the server holds, for a test to look at or to change behind the screen's back. */
  feedbacks: Stored[]
  types: WireReference[]
  statuses: WireStatus[]
}

/** The feedback API as `me` (null: nobody is logged in, every route answers 401). */
export function createFakeFeedbackApi(me: FakeUser | null): FakeApi {
  const types = seedTypes()
  const statuses = seedStatuses()
  const feedbacks = me ? seedFeedback(me) : []

  const visible = (id: string) => {
    const found = feedbacks.find((f) => f.id === id)
    return found && (me?.is_admin || found.created_by === me?.user_id) ? found : undefined
  }
  const pageOf = <T>(items: T[], params: URLSearchParams) => {
    const limit = Number(params.get('limit') ?? 10)
    const offset = Number(params.get('offset') ?? 0)
    return { items: items.slice(offset, offset + limit), total: items.length, limit, offset }
  }
  const listed = (params: URLSearchParams, everyone: boolean) => {
    const wanted = params.get('status')
    const closed = new Set(statuses.filter((s) => s.is_closed).map((s) => s.id))
    return feedbacks
      .filter((f) => everyone || f.created_by === me?.user_id)
      .filter((f) => (wanted === 'open' ? !closed.has(f.status_id) : !wanted || f.status_id === wanted))
      .filter((f) => !params.get('type_id') || f.type_id === params.get('type_id'))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at) || b.id.localeCompare(a.id))
  }

  const attach = (feedbackId: string, form: FormData): WireAttachment[] | Reply => {
    const files = form.getAll('files').filter((f): f is File => f instanceof File)
    if (files.length > 5) return fail(422, 'Too many screenshots')
    for (const file of files) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return fail(415, 'The image must be a PNG, JPEG or WebP')
    }
    return files.map((file) => picture(feedbackId, file.name))
  }

  function create(form: FormData) {
    const title = String(form.get('title') ?? '').trim()
    const description = String(form.get('description') ?? '').trim()
    const chosen = types.find((t) => t.id === form.get('type_id'))
    const page = form.get('page') ? String(form.get('page')) : null
    if (!title || !description) return fail(422, 'Field required')
    if (!chosen) return fail(422, 'This type or status does not exist')
    if (chosen.archived) return fail(422, 'This type or status is archived and can no longer be chosen')
    if (page && !(page.startsWith('/') && !page.startsWith('//'))) return fail(422, 'The page must be a path of the app, starting with a single /')
    const id = nextId('fb')
    const attachments = attach(id, form)
    if (attachments instanceof Reply) return attachments
    const now = new Date().toISOString()
    const feedback: Stored = {
      id, title, description, type_id: chosen.id, status_id: 'new', created_by: me!.user_id, created_by_username: me!.username,
      page, created_at: now, updated_at: now, attachments, messages: [],
    }
    feedbacks.push(feedback)
    return new Reply(201, detail(feedback))
  }

  function answer(feedback: Stored, form: FormData) {
    const body = String(form.get('body') ?? '').trim()
    if (!body) return fail(422, 'The message is empty')
    const attachments = attach(feedback.id, form)
    if (attachments instanceof Reply) return attachments
    const created = message({ body, author_username: me!.username, author_is_staff: me!.is_admin, created_at: new Date().toISOString(), attachments })
    feedback.messages.push(created)
    feedback.updated_at = created.created_at
    return new Reply(201, created)
  }

  function modify(feedback: Stored, json: { status_id?: string | null; type_id?: string | null }) {
    if (json.status_id == null && json.type_id == null) return fail(422, 'Send a status_id, a type_id or both')
    if (json.type_id != null) {
      if (!me!.is_admin) return fail(403, 'You are not allowed to do this')
      const chosen = types.find((t) => t.id === json.type_id)
      if (!chosen) return fail(422, 'This type or status does not exist')
      if (chosen.archived) return fail(422, 'This type or status is archived and can no longer be chosen')
      feedback.type_id = chosen.id
    }
    if (json.status_id != null) {
      const target = statuses.find((s) => s.id === json.status_id)
      if (!target) return fail(422, 'This type or status does not exist')
      if (target.archived) return fail(422, 'This type or status is archived and can no longer be chosen')
      const current = statuses.find((s) => s.id === feedback.status_id)!
      if (target.id !== current.id) {
        const author = (target.key === 'closed' && !current.is_closed) || (target.key === 'new' && current.is_closed)
        if (!me!.is_admin && !author) return fail(403, 'You are not allowed to do this')
        const at = new Date().toISOString()
        feedback.messages.push(change(me!.username, at, current.id, target.id))
        feedback.messages[feedback.messages.length - 1].author_is_staff = me!.is_admin
        feedback.status_id = target.id
        feedback.updated_at = at
      }
    }
    return detail(feedback)
  }

  function thread(feedback: Stored, params: URLSearchParams) {
    const limit = Number(params.get('limit') ?? 10)
    const before = params.get('before')
    // The cursor is the position of the oldest message of the page before: opaque for the screen, as in the backend.
    const end = before === null ? feedback.messages.length : Number(before.replace('cursor-', ''))
    if (Number.isNaN(end)) return fail(422, 'This page cursor is not valid')
    const start = Math.max(end - limit, 0)
    return {
      items: feedback.messages.slice(start, end),
      total: feedback.messages.length,
      next_before: start > 0 ? `cursor-${start}` : null,
    }
  }

  function saveReference(list: WireReference[], json: Record<string, unknown>, id?: string) {
    if (!me!.is_admin) return fail(403, 'Administrators only')
    const name = typeof json.name === 'string' ? json.name.trim() : undefined
    if (name !== undefined && list.some((x) => x.id !== id && x.name.toLowerCase() === name.toLowerCase())) {
      return fail(409, 'A value with this name already exists')
    }
    if (!id) {
      if (!name) return fail(422, 'Field required')
      const item = {
        ...type(nextId('ref'), name, String(json.description ?? ''), (json.tone as WireReference['tone']) ?? 'gray', list.length + 1),
        created_by: me!.user_id, created_by_username: me!.username, created_at: new Date().toISOString(),
        ...(list === statuses ? { key: null, is_closed: Boolean(json.is_closed) } : {}),
      }
      list.push(item as WireReference)
      return new Reply(201, item)
    }
    const found = list.find((x) => x.id === id)
    if (!found) return fail(404, 'This type or status does not exist')
    if (json.archived === true && list === statuses && ['new', 'closed'].includes((found as WireStatus).key ?? '')) {
      return fail(409, 'This status is used by the app itself and cannot be archived')
    }
    if (name !== undefined) found.name = name
    if (typeof json.description === 'string') found.description = json.description
    if (json.tone) found.tone = json.tone as WireReference['tone']
    if (typeof json.archived === 'boolean') found.archived = json.archived
    if (list === statuses && typeof json.is_closed === 'boolean') (found as WireStatus).is_closed = json.is_closed
    return found
  }

  function handle(url: string, init: RequestInit = {}): Reply | unknown {
    if (!me) return fail(401, 'Not authenticated')
    const [path, query = ''] = url.split('?')
    const params = new URLSearchParams(query)
    const method = (init.method ?? 'GET').toUpperCase()
    const json = typeof init.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {}
    const form = init.body instanceof FormData ? init.body : new FormData()
    let m: RegExpMatchArray | null

    if (path === '/api/feedback-types') return types
    if (path === '/api/feedback-statuses') return statuses
    if (path === '/api/feedback' && method === 'POST') return create(form)
    if (path === '/api/feedback') return pageOf(listed(params, false).map(summary), params)
    if (path === '/api/admin/feedback') return me.is_admin ? pageOf(listed(params, true).map(summary), params) : fail(403, 'Administrators only')
    if ((m = path.match(/^\/api\/admin\/feedback-(types|statuses)(?:\/([^/]+))?$/))) {
      return saveReference(m[1] === 'types' ? types : statuses, json, m[2])
    }
    if ((m = path.match(/^\/api\/feedback\/([^/]+)(\/messages)?$/))) {
      const feedback = visible(m[1])
      if (!feedback) return fail(404, 'This feedback does not exist')
      if (m[2]) return method === 'POST' ? answer(feedback, form) : thread(feedback, params)
      return method === 'PATCH' ? modify(feedback, json) : detail(feedback)
    }
    return undefined
  }

  return { handle, feedbacks, types, statuses }
}
