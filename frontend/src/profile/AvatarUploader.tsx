import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/auth/AuthProvider'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'
import { AVATAR_TYPES, useAvatar } from './useAvatar'

/** The profile photo with the buttons to change or remove it. */
export function AvatarUploader() {
  const { t } = useTranslation()
  const { user, avatarVersion } = useCurrentUser()
  const { hasAvatar, busy, error, upload, remove } = useAvatar()
  const input = useRef<HTMLInputElement>(null)
  if (!user) return null

  return (
    <div className="flex items-center gap-6">
      <UserAvatar user={user} version={avatarVersion} className="size-20 text-xl" />
      <div className="grid gap-2">
        <div className="flex gap-2">
          <Button variant="outline" disabled={busy} onClick={() => input.current?.click()}>
            {t('profile.change')}
          </Button>
          {hasAvatar && (
            <Button variant="ghost" disabled={busy} onClick={() => void remove()}>
              {t('profile.remove')}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t('profile.hint')}</p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {t(`profile.errors.${error}`)}
          </p>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={AVATAR_TYPES.join(',')}
        aria-label={t('profile.change')}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = '' // choosing the same file again must work
          if (file) void upload(file)
        }}
      />
    </div>
  )
}
