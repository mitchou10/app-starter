import { expect, it } from 'vitest'
import { initials } from './UserAvatar'

it('takes the initials of the name, else of the username, else of the email', () => {
  expect(initials({ name: 'Ada Lovelace', username: 'ada', email: 'a@b.c' })).toBe('AL')
  expect(initials({ name: '', username: 'ada_lovelace', email: 'a@b.c' })).toBe('AL')
  expect(initials({ name: '', username: '', email: 'ada@example.com' })).toBe('AE')
  expect(initials({ name: 'Cher', username: '', email: '' })).toBe('C')
})
