import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from './App.vue'
import { useCurrentUser } from './composables/useCurrentUser'

const ada = { user_id: '1', email: 'ada@example.com', name: 'Ada', username: 'ada', roles: [], groups: [], is_admin: false }

function stubFetch(handler: (url: string, init?: RequestInit) => unknown) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => handler(url, init)))
}

beforeEach(() => {
  useCurrentUser().user.value = null
})
afterEach(() => vi.unstubAllGlobals())

it('offers to sign in when nobody is logged in', async () => {
  stubFetch(() => ({ ok: false, json: async () => ({}) }))
  const wrapper = mount(App)
  await flushPromises()
  expect(wrapper.text()).toContain('Sign in')
})

it('treats an unreachable backend as logged out', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  const wrapper = mount(App)
  await flushPromises()
  expect(wrapper.text()).toContain('Sign in')
})

it('shows the logged-in user', async () => {
  stubFetch(() => ({ ok: true, json: async () => ada }))
  const wrapper = mount(App)
  await flushPromises()
  expect(wrapper.text()).toContain('Signed in as Ada')
})

it('sends the browser to the backend to sign in, keeping only an internal path', () => {
  const location = { href: '' }
  vi.stubGlobal('window', { location })
  useCurrentUser().login('/settings?tab=1')
  expect(location.href).toBe('/api/auth/login?redirect=%2Fsettings%3Ftab%3D1')
})

it('signs out and follows the provider logout url', async () => {
  const location = { href: '' }
  vi.stubGlobal('window', { location })
  stubFetch(() => ({ ok: true, json: async () => ({ logout_url: 'https://idp/logout' }) }))
  const { user, logout } = useCurrentUser()
  user.value = ada
  await logout()
  expect(user.value).toBeNull()
  expect(location.href).toBe('https://idp/logout')
})

it('signs out locally when the provider has no logout url', async () => {
  const location = { href: '' }
  vi.stubGlobal('window', { location })
  stubFetch(() => ({ ok: true, json: async () => ({ logout_url: null }) }))
  await useCurrentUser().logout()
  expect(location.href).toBe('/')
})
