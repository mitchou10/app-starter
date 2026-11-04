import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import App from './App.vue'

afterEach(() => vi.unstubAllGlobals())

it('shows the backend status', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ status: 'ok' }) }))
  const wrapper = mount(App)
  await flushPromises()
  expect(wrapper.text()).toContain('Backend: ok')
})

it('shows when the backend is unreachable', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  const wrapper = mount(App)
  await flushPromises()
  expect(wrapper.text()).toContain('Backend: unreachable')
})
