import { useEffect } from 'react'
import { useFeedback } from '../FeedbackProvider'
import { isFeedbackShortcut } from '../shortcut'
import { FeedbackDialog } from './FeedbackDialog'

/** The "Give feedback" modal and the keyboard shortcut that opens it, mounted once inside the app layout. */
export function FeedbackLauncher() {
  const { dialog, openDialog } = useFeedback()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isFeedbackShortcut(event)) return
      event.preventDefault() // not the browser's own meaning of the key
      if (!dialog.open) openDialog()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [dialog.open, openDialog])

  return <FeedbackDialog />
}
