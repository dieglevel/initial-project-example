import { AUTH_TOKEN_KEY } from './auth.type'

let memoryAccessToken: string | null = null

export const AccessTokenService = {
  set(token: string) {
    memoryAccessToken = token

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(AUTH_TOKEN_KEY.ACCESS_TOKEN, token)
    }
  },

  get(): string | null {
    if (memoryAccessToken) return memoryAccessToken

    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem(AUTH_TOKEN_KEY.ACCESS_TOKEN)
      memoryAccessToken = token
      return token
    }

    return null
  },

  clear() {
    memoryAccessToken = null

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(AUTH_TOKEN_KEY.ACCESS_TOKEN)
    }
  },
}
