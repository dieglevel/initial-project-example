// services/auth/refreshToken.service.ts

import { CookieService } from '../utils/cookie'
import { AUTH_TOKEN_KEY } from './auth.type'

export const RefreshTokenService = {
  set(token: string) {
    CookieService.set(AUTH_TOKEN_KEY.REFRESH_TOKEN, token, {
      days: 1,
      secure: true,
      sameSite: 'Strict',
    })
  },

  get(): string | null {
    return CookieService.get(AUTH_TOKEN_KEY.REFRESH_TOKEN)
  },

  clear() {
    CookieService.remove(AUTH_TOKEN_KEY.REFRESH_TOKEN)
  },
}
