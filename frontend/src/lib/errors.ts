import { ApiError } from './api'

export type ErrorKind =
  | 'tooLarge'
  | 'unsupported'
  | 'tooMany'
  | 'forbidden'
  | 'notFound'
  | 'duplicate'
  | 'conflict'
  | 'invalid'
  | 'network'
  | 'failed'

/** What went wrong, in terms the screen can say (the key of `feedback.errors.<kind>` in the translations). */
export function errorKind(error: unknown): ErrorKind {
  if (!(error instanceof ApiError)) return 'network'
  switch (error.status) {
    case 403:
      return 'forbidden'
    case 404:
      return 'notFound'
    case 409:
      // A name taken, or a value the app itself relies on: the sentence of the backend tells which.
      return /already exists/i.test(error.message) ? 'duplicate' : 'conflict'
    case 413:
      return 'tooLarge'
    case 415:
      return 'unsupported'
    case 422:
      return /too many/i.test(error.message) ? 'tooMany' : 'invalid'
    default:
      return 'failed'
  }
}
