import { AccessTokenService } from './accessToken.service'
import { RefreshTokenService } from './refreshToken.service'
import { UserTokenService } from './userToken.service'
import type { IUser } from './auth.type'

export const AuthTokenService = {
  setTokens(accessToken: string, refreshToken: string, user: IUser) {
    AccessTokenService.set(accessToken)
    UserTokenService.set(user)
    RefreshTokenService.set(refreshToken)
  },

  getAccessToken() {
    return AccessTokenService.get()
  },

  getRefreshToken() {
    return RefreshTokenService.get()
  },

  clearTokens() {
    AccessTokenService.clear()
    RefreshTokenService.clear()
  },

  loadTokens(): {
    accessToken: string | null
    refreshToken: string | null
    user: IUser | null
  } | null {
    const accessToken = AccessTokenService.get()
    const refreshToken = RefreshTokenService.get()
    const user = UserTokenService.get()
    if (!accessToken || !user || !refreshToken) {
      return null
    }

    return {
      accessToken,
      refreshToken,
      user,
    }
  },
}
