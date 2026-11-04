import type { CurrentUser } from '@/auth/AuthProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Person = Pick<CurrentUser, 'name' | 'username' | 'email'>

/** The person's initials, shown while there is no photo (or if it cannot be loaded). */
export function initials(user: Person) {
  const source = user.name || user.username || user.email
  const words = source.split(/[\s@._-]+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

interface UserAvatarProps {
  user: Person
  /** Version of the photo (see AuthProvider): without one, only the initials are shown. */
  version?: number | null
  className?: string
}

export function UserAvatar({ user, version, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {version != null && <AvatarImage src={`/api/me/avatar?v=${version}`} alt="" />}
      <AvatarFallback>{initials(user)}</AvatarFallback>
    </Avatar>
  )
}
