import type { Tone } from '../types'

/** Classes written in full so Tailwind finds them. Light and dark. */
export const TONE_CLASSES: Record<Tone, string> = {
  gray: 'bg-muted text-muted-foreground',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
}

export const TONES = Object.keys(TONE_CLASSES) as Tone[]
