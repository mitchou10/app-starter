import { ApiError } from './client'

export type ErrorKind =
  | 'tooLarge'
  | 'unsupported'
  | 'tooMany'
  | 'forbidden'
  | 'notFound'
  | 'duplicate'
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
      return 'duplicate'
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
