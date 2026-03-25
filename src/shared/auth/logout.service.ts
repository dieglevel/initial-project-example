import { useAuthStore } from '../store/auth.store'
import { AccessTokenService } from './accessToken.service'
import { RefreshTokenService } from './refreshToken.service'
import { UserTokenService } from './userToken.service'

export const LogoutService = {
  logout() {
    // Clear user token and other related data
    UserTokenService.clear()
    // You can also clear other data related to the user session here

    AccessTokenService.clear()
    RefreshTokenService.clear()

    useAuthStore.getState().clearAuth()

    // Optionally, you can redirect the user to the login page or home page
    if (typeof window !== 'undefined') {
      window.location.href = '/login' // Redirect to login page
    }
  },
}
