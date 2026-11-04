import { screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { FEATURES } from './content'
import { LandingPage } from './LandingPage'

function renderPage() {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))
  return renderWithProviders(<LandingPage />)
}

it('shows the hero and one card per feature', async () => {
  const { container } = renderPage()
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Build your next app on solid ground')
  const features = container.querySelector<HTMLElement>('#features')!
  expect(within(features).getAllByRole('heading', { level: 3 })).toHaveLength(FEATURES.length)
})

it('every feature has a title and a description in each language', async () => {
  const { default: i18n } = await import('@/i18n')
  for (const language of ['en', 'fr']) {
    for (const { key } of FEATURES) {
      expect(i18n.exists(`landing.features.${key}.title`, { lng: language })).toBe(true)
      expect(i18n.exists(`landing.features.${key}.description`, { lng: language })).toBe(true)
    }
  }
})
