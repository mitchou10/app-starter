import { ref } from 'vue'

export interface CurrentUser {
  user_id: string
  email: string
  name: string
  username: string
  roles: string[]
  groups: string[]
  is_admin: boolean
}

const user = ref<CurrentUser | null>(null)
const loaded = ref(false)

export function useCurrentUser() {
  // 401 is the normal answer of a visitor who is not logged in, not an error.
  async function load() {
    try {
      const response = await fetch('/api/auth/me')
      user.value = response.ok ? ((await response.json()) as CurrentUser) : null
    } catch {
      user.value = null
    }
    loaded.value = true
  }

  // The browser leaves for the identity provider: the backend (BFF) runs the whole flow and keeps the tokens.
  function login(redirect = '/') {
    window.location.href = `/api/auth/login?redirect=${encodeURIComponent(redirect)}`
  }

  async function logout() {
    const response = await fetch('/api/auth/logout', { method: 'POST' })
    const { logout_url } = (await response.json()) as { logout_url: string | null }
    user.value = null
    window.location.href = logout_url ?? '/'
  }

  return { user, loaded, load, login, logout }
}
