import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'

interface FeedbackDialogContext {
  open: boolean
  /** The page the user was on when the dialog opened: it is attached to the feedback if they agree. */
  page: string | null
  /** Opens "Give feedback", remembering the page the user is on right now. */
  openDialog: () => void
  closeDialog: () => void
}

const Context = createContext<FeedbackDialogContext | null>(null)

/** Whether the "Give feedback" modal is open, so the menu, the button and the shortcut can all open the same one. */
export function FeedbackDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; page: string | null }>({ open: false, page: null })
  const location = useLocation()
  const here = useRef('')
  here.current = location.pathname + location.search

  const openDialog = useCallback(() => setState({ open: true, page: here.current }), [])
  const closeDialog = useCallback(() => setState((current) => ({ ...current, open: false })), [])
  const value = useMemo(() => ({ ...state, openDialog, closeDialog }), [state, openDialog, closeDialog])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useFeedbackDialog(): FeedbackDialogContext {
  const context = useContext(Context)
  if (!context) throw new Error('useFeedbackDialog must be used inside <FeedbackDialogProvider>')
  return context
}
