import { useCallback, useState } from 'react'
import { useCurrentUser } from '@/auth/AuthProvider'

/** Same limit as the backend (AVATAR_MAX_BYTES): checked here too, to answer without sending the file. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export type AvatarError = 'tooLarge' | 'unsupported' | 'failed'

/** Sends, replaces and removes the profile photo. `error` is a key of `profile.errors` in the translations. */
export function useAvatar() {
  const { avatarVersion, refreshProfile } = useCurrentUser()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<AvatarError | null>(null)

  const run = useCallback(
    async (request: () => Promise<Response>) => {
      setBusy(true)
      setError(null)
      try {
        const response = await request()
        if (response.status === 413) setError('tooLarge')
        else if (response.status === 415) setError('unsupported')
        else if (!response.ok) setError('failed')
        else await refreshProfile()
      } catch {
        setError('failed')
      } finally {
        setBusy(false)
      }
    },
    [refreshProfile],
  )

  const upload = useCallback(
    async (file: File) => {
      if (file.size > AVATAR_MAX_BYTES) return setError('tooLarge')
      if (!AVATAR_TYPES.includes(file.type)) return setError('unsupported')
      const body = new FormData()
      body.append('file', file)
      await run(() => fetch('/api/me/avatar', { method: 'PUT', body }))
    },
    [run],
  )

  const remove = useCallback(() => run(() => fetch('/api/me/avatar', { method: 'DELETE' })), [run])

  return { hasAvatar: avatarVersion != null, busy, error, upload, remove }
}
