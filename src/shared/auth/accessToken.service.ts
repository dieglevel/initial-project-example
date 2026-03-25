import { CookieService } from '../utils/cookie'
import { AUTH_TOKEN_KEY } from './auth.type'

let memoryAccessToken: string | null = null

export const AccessTokenService = {
  set(token: string) {
    memoryAccessToken = token

    if (typeof window !== 'undefined') {
      CookieService.set(AUTH_TOKEN_KEY.ACCESS_TOKEN, token, {
        days: 1 / 24,
      })
    }
  },

  get(): string | null {
    if (memoryAccessToken) return memoryAccessToken

    if (typeof window !== 'undefined') {
      const token = CookieService.get(AUTH_TOKEN_KEY.ACCESS_TOKEN)
      memoryAccessToken = token
      return token
    }

    return null
  },

  clear() {
    memoryAccessToken = null

    if (typeof window !== 'undefined') {
      CookieService.remove(AUTH_TOKEN_KEY.ACCESS_TOKEN)
    }
  },
}
