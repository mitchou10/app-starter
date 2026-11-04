import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { createFakeFeedbackApi } from '@/test/fakeFeedbackApi'
import { ada, bob, renderApp, Reply, stubBackend } from '@/test/render'

type TestUser = typeof ada | typeof bob

/** Opens the app at `path` as `user`, once what the page loads has arrived. */
async function open(path: string, user: TestUser = bob) {
  stubBackend(user)
  return opened(path)
}

async function opened(path: string) {
  const router = renderApp(path)
  await screen.findByRole('button', { name: 'Open the user menu' })
  await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
  return router
}

/** The app with the real fake backend, except where `override` answers instead (a failure, a slow call...). */
async function openWith(path: string, user: TestUser, override: (url: string, init?: RequestInit) => Reply | undefined) {
  const fake = createFakeFeedbackApi({ user_id: user.user_id, username: user.username, name: user.name, is_admin: user.is_admin })
  stubBackend(user, (url, init) => override(url, init) ?? fake.handle(url, init))
  return opened(path)
}

async function pick(label: string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: label }))
  await userEvent.click(await screen.findByRole('option', { name: option }))
}

// ---- my feedback

it('lists only my feedback, with its type, its status and its number of answers', async () => {
  await open('/feedback')
  expect(screen.getByRole('heading', { name: 'My feedback' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Dark mode/ })).toBeInTheDocument()
  expect(screen.queryByText('Export my data as CSV')).not.toBeInTheDocument() // somebody else's
  const item = screen.getByRole('link', { name: /save button/ })
  expect(await within(item).findByText('Bug')).toBeInTheDocument()
  expect(within(item).getByText('In progress')).toBeInTheDocument()
  expect(within(item).getByTitle('Answers')).toHaveTextContent('17')
})

it('filters by status on the server, "open" meaning every status that is not closed', async () => {
  await open('/feedback')
  await pick('Filter by status', 'Open')
  await waitFor(() => expect(screen.queryByRole('link', { name: /How do I change the language/ })).not.toBeInTheDocument()) // Done
  expect(screen.getByRole('link', { name: /Dark mode/ })).toBeInTheDocument()
})

it('filters by type and says so when nothing matches', async () => {
  await open('/feedback')
  await pick('Filter by type', 'Bug')
  await waitFor(() => expect(screen.queryByRole('link', { name: /Dark mode/ })).not.toBeInTheDocument())
  await pick('Filter by status', 'New')
  expect(await screen.findByText('No feedback here.')).toBeInTheDocument()
})

it('says so when the list cannot be loaded', async () => {
  await openWith('/feedback', bob, (url) => (url.startsWith('/api/feedback?') ? new Reply(500, { detail: 'boom' }) : undefined))
  expect(await screen.findByText('Something went wrong. Try again.')).toBeInTheDocument()
})

// ---- give feedback

async function openDialog() {
  await userEvent.click(screen.getByRole('button', { name: 'Open the user menu' }))
  await userEvent.click(await screen.findByRole('menuitem', { name: /Give feedback/ }))
  return screen.findByRole('dialog')
}

async function fill(dialog: HTMLElement, type = 'Suggestion') {
  await userEvent.type(within(dialog).getByLabelText('Title'), 'Export is slow')
  await userEvent.type(within(dialog).getByLabelText('Description'), 'It takes a minute.')
  await userEvent.click(within(dialog).getByRole('combobox', { name: 'Type' }))
  await userEvent.click(await screen.findByRole('option', { name: type }))
}

it('opens from the profile menu, asks for the missing fields, then sends and shows the new feedback', async () => {
  const router = await open('/app')
  const dialog = await openDialog()

  await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }))
  expect(within(dialog).getAllByText('This field is required.')).toHaveLength(3)

  await fill(dialog)
  await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }))

  expect(await screen.findByRole('heading', { name: 'Export is slow' })).toBeInTheDocument()
  expect(router.state.location.pathname).toMatch(/^\/feedback\/fb-/)
  expect(await screen.findAllByText('New')).not.toHaveLength(0)
  // and it is at the top of my list
  expect(within(screen.getByRole('region', { name: 'Feedback list' })).getAllByRole('link')[0]).toHaveTextContent('Export is slow')
})

it('keeps what was typed and says why when the feedback is refused', async () => {
  await openWith('/app', bob, (url, init) =>
    url === '/api/feedback' && init?.method === 'POST' ? new Reply(415, { detail: 'The image must be a PNG, JPEG or WebP' }) : undefined,
  )
  const dialog = await openDialog()
  await fill(dialog)
  await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }))
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Only PNG, JPEG or WebP images.')
  expect(within(dialog).getByLabelText('Title')).toHaveValue('Export is slow') // still there to send again
  expect(within(dialog).getByRole('button', { name: 'Send' })).toBeEnabled()
})

it('forgets an old error when the dialog is opened again', async () => {
  await openWith('/app', bob, (url, init) => (url === '/api/feedback' && init?.method === 'POST' ? new Reply(500) : undefined))
  let dialog = await openDialog()
  await fill(dialog)
  await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }))
  await within(dialog).findByRole('alert')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  dialog = await openDialog()
  expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()
})

it('can be cancelled without creating anything', async () => {
  await open('/feedback')
  const dialog = await openDialog()
  await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(within(screen.getByRole('region', { name: 'Feedback list' })).getAllByRole('listitem')).toHaveLength(10) // one page
})

// ---- one feedback

it('shows the latest part of the follow-up first, with the changes of status, and loads the older ones on request', async () => {
  await open('/feedback/fb-1')
  const thread = screen.getByRole('log', { name: 'Follow-up' })
  // 19 messages, the last 10 are shown: the newest answer and the last change of status are there...
  expect(within(thread).getByText('Found it, a request fails silently. Fixing it.')).toBeInTheDocument()
  expect(within(thread).getByText(/grace changed the status/)).toBeInTheDocument()
  expect(within(thread).getAllByText('Team').length).toBeGreaterThan(0)
  // ... the first ones are not
  expect(within(thread).queryByText('Thanks for the report. Which browser version are you on?')).not.toBeInTheDocument()

  await userEvent.click(within(thread).getByRole('button', { name: /Show 9 older messages/ }))
  expect(await within(thread).findByText('Thanks for the report. Which browser version are you on?')).toBeInTheDocument()
  expect(within(thread).getAllByText(/grace changed the status/)).toHaveLength(2) // both changes of status
  expect(within(thread).queryByRole('button', { name: /older messages/ })).not.toBeInTheDocument()
})

it('shows the screenshots of the feedback and of its answers', async () => {
  await open('/feedback/fb-1')
  const images = await screen.findAllByRole('img', { name: /\.png$/ })
  expect(images.length).toBeGreaterThanOrEqual(2)
  expect(images[0]).toHaveAttribute('src', expect.stringMatching(/^\/api\/feedback\/fb-1\/attachments\//))
})

it('lets the author reply, close and reopen, but not change the status', async () => {
  await open('/feedback/fb-2')
  // an author is not the team: no choice of status, no choice of type, only to close it
  expect(await screen.findByRole('button', { name: 'Close this feedback' })).toBeInTheDocument()
  expect(screen.queryByRole('combobox', { name: 'Status' })).not.toBeInTheDocument()
  expect(screen.queryByRole('combobox', { name: 'Type' })).not.toBeInTheDocument()

  await userEvent.type(screen.getByLabelText('Your answer'), 'Thanks!')
  await userEvent.click(screen.getByRole('button', { name: 'Send answer' }))
  expect(await screen.findByText('Thanks!')).toBeInTheDocument()
  expect(screen.getByLabelText('Your answer')).toHaveValue('') // cleared once sent

  await userEvent.click(screen.getByRole('button', { name: 'Close this feedback' }))
  expect(await screen.findByText(/bob changed the status/)).toBeInTheDocument()
  expect((await screen.findAllByText('Closed')).length).toBeGreaterThan(0)

  await userEvent.click(await screen.findByRole('button', { name: 'Reopen this feedback' }))
  expect(await screen.findByRole('button', { name: 'Close this feedback' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Reopen this feedback' })).not.toBeInTheDocument()
})

it('keeps the answer and says why when it is refused', async () => {
  await openWith('/feedback/fb-2', bob, (url, init) =>
    url.endsWith('/messages') && init?.method === 'POST' ? new Reply(422, { detail: 'Too many screenshots' }) : undefined,
  )
  await userEvent.type(screen.getByLabelText('Your answer'), 'Thanks!')
  await userEvent.click(screen.getByRole('button', { name: 'Send answer' }))
  expect(await screen.findByText('5 screenshots at most.')).toBeInTheDocument()
  expect(screen.getByLabelText('Your answer')).toHaveValue('Thanks!')
})

it('sends an answer with its screenshots', async () => {
  const fake = createFakeFeedbackApi({ user_id: bob.user_id, username: bob.username, name: bob.name, is_admin: false })
  stubBackend(bob, fake.handle)
  await opened('/feedback/fb-2')
  await userEvent.type(screen.getByLabelText('Your answer'), 'Look at this')
  await userEvent.upload(screen.getByLabelText('Add screenshots', { selector: 'input' }), new File(['x'], 'broken.png', { type: 'image/png' }), { applyAccept: false })
  await userEvent.click(screen.getByRole('button', { name: 'Send answer' }))
  expect(await screen.findByText('Look at this')).toBeInTheDocument()
  expect(await screen.findByRole('img', { name: 'broken.png' })).toBeInTheDocument()
})

it("hides somebody else's feedback from a user", async () => {
  await open('/feedback/fb-4')
  expect(await screen.findByText('This feedback does not exist.')).toBeInTheDocument()
})

it('lets an admin change the status and the type of any feedback', async () => {
  await open('/feedback/fb-4', ada)
  expect(await screen.findByRole('heading', { name: 'Export my data as CSV' })).toBeInTheDocument()
  await pick('Status', 'Planned')
  expect(await screen.findByText(/ada changed the status/)).toBeInTheDocument()
  await pick('Type', 'Question')
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Type' })).toHaveTextContent('Question'))
})

it('tells an author that the team has not allowed it, when the backend says no', async () => {
  await openWith('/feedback/fb-2', bob, (_url, init) => (init?.method === 'PATCH' ? new Reply(403, { detail: 'You are not allowed to do this' }) : undefined))
  await userEvent.click(screen.getByRole('button', { name: 'Close this feedback' }))
  expect(await screen.findByText('You are not allowed to do this.')).toBeInTheDocument()
})

it('says so for an address that matches no feedback', async () => {
  await open('/feedback/nope')
  expect(await screen.findByText('This feedback does not exist.')).toBeInTheDocument()
})

// ---- administration

it('keeps the administration out of the sidebar and in the profile menu, for admins only', async () => {
  await open('/app', ada)
  const sidebar = document.querySelector('[data-sidebar="sidebar"]') as HTMLElement
  expect(within(sidebar).getByRole('link', { name: 'Home' })).toBeInTheDocument()
  expect(within(sidebar).queryByRole('link', { name: /feedback/i })).not.toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Open the user menu' }))
  expect(await screen.findByText('Administration')).toBeInTheDocument()
  expect(screen.getByRole('menuitem', { name: 'Manage feedback' })).toHaveAttribute('href', '/admin/feedback')
})

it('does not show the administration to a user', async () => {
  await open('/app')
  await userEvent.click(screen.getByRole('button', { name: 'Open the user menu' }))
  await screen.findByRole('menuitem', { name: 'Manage my feedback' })
  expect(screen.queryByText('Administration')).not.toBeInTheDocument()
})

it('shows an admin all the open feedback with its author', async () => {
  await open('/admin/feedback', ada)
  expect(screen.getByRole('link', { name: /Export my data as CSV/ })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Photo upload fails/ })).toBeInTheDocument()
  expect(screen.getAllByText(/linus/).length).toBeGreaterThan(0) // the author is shown
  expect(screen.queryByRole('link', { name: /How do I change the language/ })).not.toBeInTheDocument() // done
})

it('refuses the administration pages to a user', async () => {
  await open('/admin/feedback', bob)
  expect(screen.getByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
  expect(screen.queryByText('Export my data as CSV')).not.toBeInTheDocument()
})

it('lets an admin add a type, who created it is shown, and archive it so it is no longer offered', async () => {
  await open('/admin/feedback/settings', ada)
  expect((await screen.findAllByText('System')).length).toBeGreaterThan(0)

  await userEvent.click(screen.getByRole('button', { name: 'Add' }))
  const dialog = await screen.findByRole('dialog')
  await userEvent.type(within(dialog).getByLabelText('Name'), 'Praise')
  await userEvent.type(within(dialog).getByLabelText('Description'), 'Something you like.')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
  const row = (await screen.findByText('Praise')).closest('tr')!
  expect(within(row).getByText('ada')).toBeInTheDocument() // created by

  await userEvent.click(within(row).getByRole('button', { name: 'Archive' }))
  expect(await within(row).findByRole('button', { name: 'Restore' })).toBeInTheDocument()
})

it('refuses a name that is taken and keeps the dialog open with the reason', async () => {
  await open('/admin/feedback/settings', ada)
  await screen.findByText('Bug')
  await userEvent.click(screen.getByRole('button', { name: 'Add' }))
  const dialog = await screen.findByRole('dialog')
  await userEvent.type(within(dialog).getByLabelText('Name'), 'bug')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('A value with this name already exists.')
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

it('lets an admin add a closed status and edit an existing one', async () => {
  await open('/admin/feedback/settings', ada)
  await userEvent.click(screen.getByRole('tab', { name: 'Statuses' }))
  await userEvent.click(screen.getByRole('button', { name: 'Add' }))
  let dialog = await screen.findByRole('dialog')
  await userEvent.type(within(dialog).getByLabelText('Name'), 'Duplicate')
  await userEvent.click(within(dialog).getByRole('checkbox'))
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
  const row = (await screen.findByText('Duplicate')).closest('tr')!
  expect(within(row).getByText('closed')).toBeInTheDocument()

  await userEvent.click(within(row).getByRole('button', { name: 'Edit' }))
  dialog = await screen.findByRole('dialog')
  const name = within(dialog).getByLabelText('Name')
  await userEvent.clear(name)
  await userEvent.type(name, 'Merged')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
  expect(await screen.findByText('Merged')).toBeInTheDocument()
  expect(screen.queryByText('Duplicate')).not.toBeInTheDocument()
})

it('says that a status the app uses cannot be archived', async () => {
  await open('/admin/feedback/settings', ada)
  await userEvent.click(screen.getByRole('tab', { name: 'Statuses' }))
  const row = (await screen.findAllByText('New')).map((cell) => cell.closest('tr')).find(Boolean)!
  await userEvent.click(within(row).getByRole('button', { name: 'Archive' }))
  expect(await screen.findByText('This cannot be done: the app itself relies on it.')).toBeInTheDocument()
})

it('does not offer an archived type in the form, but keeps it on existing feedback', async () => {
  const router = await open('/admin/feedback/settings', ada)
  const bug = (await screen.findByText('Bug')).closest('tr')!
  await userEvent.click(within(bug).getByRole('button', { name: 'Archive' }))
  await within(bug).findByRole('button', { name: 'Restore' })

  await act(() => router.navigate('/feedback'))
  expect((await screen.findAllByText('Bug')).length).toBeGreaterThan(0) // still shown on the feedback that has it

  const dialog = await openDialog()
  await userEvent.click(within(dialog).getByRole('combobox', { name: 'Type' }))
  expect(await screen.findByRole('option', { name: 'Suggestion' })).toBeInTheDocument()
  expect(screen.queryByRole('option', { name: 'Bug' })).not.toBeInTheDocument()
})

// ---- list and detail on one page

it('shows the list and, next to it, a hint until a feedback is selected', async () => {
  const router = await open('/feedback')
  expect(screen.getByText('Select a feedback to read it and follow up.')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('link', { name: /Dark mode/ }))
  expect(router.state.location.pathname).toBe('/feedback/fb-2')
  expect(await screen.findByRole('heading', { name: 'Dark mode' })).toBeInTheDocument()
  expect(screen.queryByText('Select a feedback to read it and follow up.')).not.toBeInTheDocument()
  // the list is still there, with the open one marked
  expect(screen.getByRole('link', { name: /Dark mode/ })).toHaveAttribute('aria-current', 'true')
  expect(screen.getByRole('link', { name: /save button/ })).not.toHaveAttribute('aria-current')
})

it('opens the detail of the address, and the list can be filtered while reading', async () => {
  await open('/feedback/fb-1')
  expect(screen.getByRole('heading', { name: /save button/ })).toBeInTheDocument()
  await pick('Filter by type', 'Question')
  await waitFor(() => expect(screen.queryByRole('link', { name: /Dark mode/ })).not.toBeInTheDocument())
  expect(screen.getByRole('heading', { name: /save button/ })).toBeInTheDocument() // still open
  expect(screen.getByRole('link', { name: /save button/ })).toBeInTheDocument() // and still listed
})

it('keeps the feedback being read in an "open" list after it is closed', async () => {
  await open('/feedback/fb-2')
  await pick('Filter by status', 'Open')
  await userEvent.click(screen.getByRole('button', { name: 'Close this feedback' }))
  await screen.findByText(/bob changed the status/)
  expect(screen.getByRole('link', { name: /Dark mode/ })).toBeInTheDocument()
})

it('gives the admin one page: the feedback with its detail, and the types and statuses in a second tab', async () => {
  const router = await open('/admin/feedback', ada)
  expect(screen.getByRole('heading', { name: 'Manage feedback' })).toBeInTheDocument()

  await userEvent.click(screen.getByRole('link', { name: /Export my data as CSV/ }))
  expect(router.state.location.pathname).toBe('/admin/feedback/fb-4')
  expect(await screen.findByRole('heading', { name: 'Export my data as CSV' })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument() // the admin's controls

  await userEvent.click(screen.getByRole('tab', { name: 'Types and statuses' }))
  expect(router.state.location.pathname).toBe('/admin/feedback/settings')
  expect(await screen.findByRole('tab', { name: 'Statuses' })).toBeInTheDocument()

  await userEvent.click(screen.getByRole('tab', { name: 'Feedback' }))
  expect(router.state.location.pathname).toBe('/admin/feedback')
})

// ---- pagination of the list

const listItems = () => within(screen.getByRole('region', { name: 'Feedback list' })).getAllByRole('listitem')

it('shows the list by pages of ten, with how many there are and a button for the next page', async () => {
  await open('/feedback')
  expect(listItems()).toHaveLength(10)
  expect(screen.getByText('10 of 12')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Show 2 more' }))
  await waitFor(() => expect(listItems()).toHaveLength(12))
  expect(screen.getByText('12 of 12')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Show .* more/ })).not.toBeInTheDocument()
})

it('starts again from the first page when the filters change', async () => {
  await open('/admin/feedback', ada)
  await pick('Filter by status', 'All statuses')
  await userEvent.click(await screen.findByRole('button', { name: /Show 10 more/ }))
  await waitFor(() => expect(listItems().length).toBe(20))
  await pick('Filter by type', 'Bug')
  await waitFor(() => expect(listItems().length).toBeLessThanOrEqual(10))
})

it('keeps the feedback being read in the list even when it is on a page that is not loaded', async () => {
  await open('/feedback/fb-m9') // the oldest of 12: on the second page
  expect(screen.getByRole('heading', { name: /Question #9/ })).toBeInTheDocument()
  expect(await screen.findByRole('link', { name: /Question #9/ })).toHaveAttribute('aria-current', 'true')
  expect(screen.getByText('11 of 12')).toBeInTheDocument() // the ten of the first page and the open one
})

it('has no count and no button when there is nothing to list', async () => {
  await open('/feedback')
  await pick('Filter by status', 'New')
  expect(await screen.findByText('No feedback here.')).toBeInTheDocument()
  expect(screen.queryByText(/ of /)).not.toBeInTheDocument()
})
