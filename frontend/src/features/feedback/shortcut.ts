/**
 * The shortcut that opens "Give feedback" from anywhere in the app. Plain Ctrl+F is the browser's "find in page", so
 * Shift is part of it. Change it here: the menu hint and the handler both read it.
 */
export const SHORTCUT_KEY = 'f'

export function isFeedbackShortcut(event: KeyboardEvent) {
  return (event.ctrlKey || event.metaKey) && event.shiftKey && !event.altKey && event.key.toLowerCase() === SHORTCUT_KEY
}

/** How the shortcut is written for the person: ⌘⇧F on a Mac, Ctrl+Shift+F elsewhere. */
export function shortcutLabel() {
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return mac ? `⌘⇧${SHORTCUT_KEY.toUpperCase()}` : `Ctrl+Shift+${SHORTCUT_KEY.toUpperCase()}`
}
