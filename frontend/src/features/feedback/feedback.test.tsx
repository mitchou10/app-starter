import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { ada, bob, renderApp, stubBackend } from '@/test/render'

/** Opens the app at `path` as `user`. */
async function open(path: string, user: typeof ada | typeof bob = bob) {
  stubBackend(user)
  const router = renderApp(path)
  await screen.findByRole('button', { name: 'Open the user menu' })
  return router
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
  expect(within(item).getByText('Bug')).toBeInTheDocument()
  expect(within(item).getByText('In progress')).toBeInTheDocument()
  expect(within(item).getByTitle('Answers')).toHaveTextContent('3')
})

it('filters by status, "open" meaning every status that is not closed', async () => {
  await open('/feedback')
  await pick('Filter by status', 'Open')
  expect(screen.getByRole('link', { name: /Dark mode/ })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /How do I change the language/ })).not.toBeInTheDocument() // Done
})

it('filters by type and says so when nothing matches', async () => {
  await open('/feedback')
  await pick('Filter by type', 'Bug')
  expect(screen.queryByRole('link', { name: /Dark mode/ })).not.toBeInTheDocument()
  await pick('Filter by status', 'New')
  expect(screen.getByText('No feedback here.')).toBeInTheDocument()
})

// ---- give feedback

async function openDialog() {
  await userEvent.click(screen.getByRole('button', { name: 'Open the user menu' }))
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Give feedback' }))
  return screen.findByRole('dialog')
}

it('opens from the profile menu, asks for the missing fields, then sends and shows the new feedback', async () => {
  const router = await open('/app')
  const dialog = await openDialog()

  await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }))
  expect(within(dialog).getAllByText('This field is required.')).toHaveLength(3)

  await userEvent.type(within(dialog).getByLabelText('Title'), 'Export is slow')
  await userEvent.type(within(dialog).getByLabelText('Description'), 'It takes a minute.')
  await userEvent.click(within(dialog).getByRole('combobox', { name: 'Type' }))
  await userEvent.click(await screen.findByRole('option', { name: 'Suggestion' }))
  await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }))

  expect(await screen.findByRole('heading', { name: 'Export is slow' })).toBeInTheDocument()
  expect(router.state.location.pathname).toMatch(/^\/feedback\/fb-/)
  expect(screen.getAllByText('New').length).toBeGreaterThan(0)
})

it('can be cancelled without creating anything', async () => {
  await open('/feedback')
  const dialog = await openDialog()
  await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(within(screen.getByRole('region', { name: 'Feedback list' })).getAllByRole('listitem')).toHaveLength(3)
})

// ---- one feedback

it('shows the follow-up: answers and changes of status, with who is from the team', async () => {
  await open('/feedback/fb-1')
  expect(screen.getByRole('heading', { name: /save button/ })).toBeInTheDocument()
  expect(screen.getByText('Thanks for the report. Which browser version are you on?')).toBeInTheDocument()
  expect(screen.getAllByText('Team').length).toBeGreaterThan(0)
  expect(screen.getAllByText(/grace changed the status/).length).toBe(2)
})

it('lets the author reply, close and reopen, but not change the status', async () => {
  await open('/feedback/fb-2')
  expect(screen.queryByRole('combobox', { name: 'Status' })).not.toBeInTheDocument()

  await userEvent.type(screen.getByLabelText('Your answer'), 'Thanks!')
  await userEvent.click(screen.getByRole('button', { name: 'Send answer' }))
  expect(screen.getByText('Thanks!')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Close this feedback' }))
  expect(screen.getAllByText('Closed').length).toBeGreaterThan(0)
  expect(screen.getByText(/bob changed the status/)).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Reopen this feedback' }))
  expect(screen.queryByRole('button', { name: 'Reopen this feedback' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Close this feedback' })).toBeInTheDocument()
})

it("hides somebody else's feedback from a user, but not from an admin", async () => {
  await open('/feedback/fb-4')
  expect(screen.getByText('This feedback does not exist.')).toBeInTheDocument()
})

it('lets an admin change the status and the type of any feedback', async () => {
  await open('/feedback/fb-4', ada)
  expect(screen.getByRole('heading', { name: 'Export my data as CSV' })).toBeInTheDocument()
  await pick('Status', 'Planned')
  expect(screen.getByText(/ada changed the status/)).toBeInTheDocument()
  await pick('Type', 'Question')
  expect(screen.getAllByText('Question').length).toBeGreaterThan(0)
})

it('says so for an address that matches no feedback', async () => {
  await open('/feedback/nope')
  expect(screen.getByText('This feedback does not exist.')).toBeInTheDocument()
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
  await screen.findByRole('menuitem', { name: 'My feedback' })
  expect(screen.queryByText('Administration')).not.toBeInTheDocument()
})

it('shows an admin all the open feedback with its author, and a user an access denied page', async () => {
  await open('/admin/feedback', ada)
  expect(screen.getByRole('link', { name: /Export my data as CSV/ })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /linus/ })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /How do I change the language/ })).not.toBeInTheDocument() // done
})

it('refuses the administration pages to a user', async () => {
  await open('/admin/feedback', bob)
  expect(screen.getByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
  expect(screen.queryByText('Export my data as CSV')).not.toBeInTheDocument()
})

it('lets an admin add a type, who created it is shown, and archive it so it is no longer offered', async () => {
  await open('/admin/feedback/settings', ada)
  expect(screen.getAllByText('System').length).toBeGreaterThan(0)

  await userEvent.click(screen.getByRole('button', { name: 'Add' }))
  const dialog = await screen.findByRole('dialog')
  await userEvent.type(within(dialog).getByLabelText('Name'), 'Praise')
  await userEvent.type(within(dialog).getByLabelText('Description'), 'Something you like.')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
  const row = (await screen.findByText('Praise')).closest('tr')!
  expect(within(row).getByText('ada')).toBeInTheDocument() // created by

  await userEvent.click(within(row).getByRole('button', { name: 'Archive' }))
  expect(within(row).getByRole('button', { name: 'Restore' })).toBeInTheDocument()
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

it('does not offer an archived type in the form, but keeps it on existing feedback', async () => {
  const router = await open('/admin/feedback/settings', ada)
  const bug = screen.getByText('Bug').closest('tr')!
  await userEvent.click(within(bug).getByRole('button', { name: 'Archive' }))

  await act(() => router.navigate('/feedback'))
  expect(screen.getAllByText('Bug').length).toBeGreaterThan(0) // still shown on the feedback that has it

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
  expect(screen.getByRole('heading', { name: /save button/ })).toBeInTheDocument() // still open
  expect(screen.getByRole('link', { name: /save button/ })).toBeInTheDocument() // and still listed
  expect(screen.queryByRole('link', { name: /Dark mode/ })).not.toBeInTheDocument()
})

it('keeps the feedback being read in an "open" list after it is closed', async () => {
  await open('/feedback/fb-2')
  await pick('Filter by status', 'Open')
  await userEvent.click(screen.getByRole('button', { name: 'Close this feedback' }))
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
