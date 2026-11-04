import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ada, renderWithProviders, stubBackend } from '@/test/render'
import { AvatarUploader } from './AvatarUploader'

const png = () => new File([new Uint8Array(10)], 'me.png', { type: 'image/png' })

/** The backend of a user without a photo: after an upload, the profile reports one. */
function backend(put: unknown = { avatar_version: 2 }) {
  let version: number | null = null
  stubBackend(ada, (url, init) => {
    if (url === '/api/me/profile') return { avatar_version: version }
    if (url === '/api/me/avatar' && init?.method === 'PUT') {
      if (typeof put === 'object' && put && 'status' in put) return put
      version = 2
      return put
    }
    if (url === '/api/me/avatar' && init?.method === 'DELETE') {
      version = null
      return { status: 204 }
    }
    return {}
  })
}

function calls(method: string) {
  return vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === method)
}

async function choose(file: File) {
  const input = await screen.findByLabelText('Change photo', { selector: 'input' })
  await userEvent.upload(input, file, { applyAccept: false })
}

it('shows the initials, the hint and no remove button while there is no photo', async () => {
  backend()
  renderWithProviders(<AvatarUploader />)
  expect(await screen.findByText('A')).toBeInTheDocument()
  expect(screen.getByText('PNG, JPEG or WebP, 2 MB at most.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Remove photo' })).not.toBeInTheDocument()
})

it('sends the photo, then offers to remove it', async () => {
  backend()
  renderWithProviders(<AvatarUploader />)
  await choose(png())
  expect(await screen.findByRole('button', { name: 'Remove photo' })).toBeInTheDocument()
  const [[, init]] = calls('PUT')
  expect(init?.body).toBeInstanceOf(FormData)
  expect((init?.body as FormData).get('file')).toBeInstanceOf(File)
})

it('removes the photo', async () => {
  backend()
  renderWithProviders(<AvatarUploader />)
  await choose(png())
  await userEvent.click(await screen.findByRole('button', { name: 'Remove photo' }))
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Remove photo' })).not.toBeInTheDocument())
  expect(calls('DELETE')).toHaveLength(1)
})

it('refuses a file that is too large without sending it', async () => {
  backend()
  renderWithProviders(<AvatarUploader />)
  await choose(new File([new Uint8Array(3 * 1024 * 1024)], 'big.png', { type: 'image/png' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('too large')
  expect(calls('PUT')).toHaveLength(0)
})

it('refuses a file that is not an image of a supported type without sending it', async () => {
  backend()
  renderWithProviders(<AvatarUploader />)
  await choose(new File(['x'], 'me.gif', { type: 'image/gif' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('not a PNG, JPEG or WebP')
  expect(calls('PUT')).toHaveLength(0)
})

it.each([
  [413, 'too large'],
  [415, 'not a PNG, JPEG or WebP'],
  [500, 'could not be saved'],
])('shows what the server answered (%i)', async (status, message) => {
  backend({ status })
  renderWithProviders(<AvatarUploader />)
  await choose(png())
  expect(await screen.findByRole('alert')).toHaveTextContent(message)
})

it('says so when the backend cannot be reached', async () => {
  backend()
  renderWithProviders(<AvatarUploader />)
  await screen.findByText('A')
  vi.mocked(fetch).mockRejectedValue(new Error('down'))
  await choose(png())
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be saved')
})
