import { CookieService } from '../utils/cookie'
import { AUTH_TOKEN_KEY } from './auth.type'
import type { IUser } from './auth.type'

let memoryUserToken: IUser | null = null

export const UserTokenService = {
  set(user: IUser) {
    memoryUserToken = user

    if (typeof window !== 'undefined') {
      CookieService.set(AUTH_TOKEN_KEY.USER, JSON.stringify(memoryUserToken), {
        days: 1 / 24,
      })
    }
  },

  get(): IUser | null {
    if (memoryUserToken) return memoryUserToken

    if (typeof window !== 'undefined') {
      const token = CookieService.get(AUTH_TOKEN_KEY.USER)
      memoryUserToken = token ? JSON.parse(token) : null
      return memoryUserToken
    }

    return null
  },

  clear() {
    memoryUserToken = null

    if (typeof window !== 'undefined') {
      CookieService.remove(AUTH_TOKEN_KEY.USER)
    }
  },
}
