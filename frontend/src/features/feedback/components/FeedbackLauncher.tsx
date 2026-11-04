import { useEffect } from 'react'
import { useFeedbackDialog } from '../FeedbackDialogProvider'
import { isFeedbackShortcut } from '../shortcut'
import { FeedbackDialog } from './FeedbackDialog'

/** The "Give feedback" modal and the keyboard shortcut that opens it, mounted once inside the app layout. */
export function FeedbackLauncher() {
  const { open, openDialog } = useFeedbackDialog()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isFeedbackShortcut(event)) return
      event.preventDefault() // not the browser's own meaning of the key
      if (!open) openDialog()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, openDialog])

  return <FeedbackDialog />
}
