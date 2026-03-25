import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AuthTokenService } from '@/shared/auth/authToken.service'
import { useAuthStore } from '@/shared/store/auth.store'
import MainLayout from '@/shared/components/layout/layout'

export const Route = createFileRoute('/(protected)')({
  component: RouteComponent,
  beforeLoad: () => {
    const loadToken = AuthTokenService.loadTokens()

    if (loadToken === null) {
      useAuthStore.setState({ isAuthenticated: false })
      throw redirect({
        to: '/login',
      })
    } else {
      useAuthStore.setState({
        isAuthenticated: true,
        accessToken: loadToken.accessToken || null,
        refreshToken: loadToken.refreshToken || null,
        user: loadToken.user || null,
      })
    }
  },
})

function RouteComponent() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  )
}
