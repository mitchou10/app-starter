import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it } from 'vitest'
import { MAX_SCREENSHOTS, ScreenshotPicker } from './components/ScreenshotPicker'

const image = (name = 'a.png', size = 10, type = 'image/png') => new File([new Uint8Array(size)], name, { type })

function Harness() {
  const [files, setFiles] = useState<File[]>([])
  return (
    <>
      <ScreenshotPicker files={files} onChange={setFiles} />
      <output aria-label="count">{files.length}</output>
    </>
  )
}

const choose = (...files: File[]) => userEvent.upload(screen.getByLabelText('Add screenshots', { selector: 'input' }), files, { applyAccept: false })

it('adds an image and shows a preview that can be removed', async () => {
  render(<Harness />)
  await choose(image('shot.png'))
  expect(screen.getByAltText('shot.png')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Remove shot.png' }))
  expect(screen.queryByAltText('shot.png')).not.toBeInTheDocument()
  expect(screen.getByLabelText('count')).toHaveTextContent('0')
})

it('refuses a type that is not supported and a file that is too large', async () => {
  render(<Harness />)
  await choose(image('a.gif', 10, 'image/gif'))
  expect(screen.getByRole('alert')).toHaveTextContent('Only PNG, JPEG or WebP')
  await choose(image('big.png', 6 * 1024 * 1024))
  expect(screen.getByRole('alert')).toHaveTextContent('too large')
  expect(screen.getByLabelText('count')).toHaveTextContent('0')
})

it('keeps at most five screenshots and then stops offering to add more', async () => {
  render(<Harness />)
  await choose(...Array.from({ length: MAX_SCREENSHOTS + 1 }, (_, i) => image(`s${i}.png`)))
  expect(screen.getByLabelText('count')).toHaveTextContent(String(MAX_SCREENSHOTS))
  expect(screen.getByRole('alert')).toHaveTextContent('5 screenshots at most')
  expect(screen.queryByRole('button', { name: 'Add screenshots' })).not.toBeInTheDocument()
})

it('adds an image pasted from the clipboard, and ignores other pastes', () => {
  render(<Harness />)
  const paste = (files: File[]) => {
    const event = new Event('paste', { bubbles: true }) as ClipboardEvent
    Object.defineProperty(event, 'clipboardData', { value: { files } })
    fireEvent(document, event)
  }
  paste([new File(['x'], 'notes.txt', { type: 'text/plain' })])
  expect(screen.getByLabelText('count')).toHaveTextContent('0')
  paste([image('pasted.png')])
  expect(screen.getByLabelText('count')).toHaveTextContent('1')
})
