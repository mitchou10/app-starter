import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { LanguageSwitcher } from './LanguageSwitcher'

it('shows the current language and switches to another one', async () => {
  render(<LanguageSwitcher />)
  const trigger = screen.getByRole('combobox', { name: 'Language' })
  expect(trigger).toHaveTextContent('English')

  await userEvent.click(trigger)
  await userEvent.click(await screen.findByRole('option', { name: 'Français' }))

  expect(screen.getByRole('combobox', { name: 'Langue' })).toHaveTextContent('Français')
  expect(localStorage.getItem('i18nextLng')).toBe('fr')
})
