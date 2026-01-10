import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AuthTokenService } from '@/shared/auth/authToken.service'
import { useAuthStore } from '@/shared/store/auth.store'

export const Route = createFileRoute('/(protected)')({
  component: () => <Outlet />,
  beforeLoad: () => {
    const accessToken = AuthTokenService.getAccessToken()
    const refreshToken = AuthTokenService.getRefreshToken()
    const user = useAuthStore.getState().user

    if (accessToken && refreshToken && user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }

    useAuthStore.setState({
      isAuthenticated: true,
      accessToken,
      refreshToken,
      user,
    })
  },
})
