import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { CurrentUser } from '@/auth/AuthProvider'

/** The person's initials (a photo can be added with <AvatarImage> when the provider gives one). */
export function initials(user: Pick<CurrentUser, 'name' | 'username' | 'email'>) {
  const source = user.name || user.username || user.email
  const words = source.split(/[\s@._-]+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export function UserAvatar({ user, className }: { user: Pick<CurrentUser, 'name' | 'username' | 'email'>; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarFallback>{initials(user)}</AvatarFallback>
    </Avatar>
  )
}
