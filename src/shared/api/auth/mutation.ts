import type { ApiBaseResponse } from '../baseResponse'
import type {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
} from './index.type'
import { useMutationPost } from '@/shared/lib/mutation/useMutation'

export const useMutationAuth = () => {
  const mLogin = useMutationPost<
    ApiBaseResponse<LoginResponse>,
    LoginRequest,
    '/auth/login'
  >({
    endPoint: '/auth/login',
    queryKey: ['auth', 'login'],
  })

  const mLogout = useMutationPost<
    ApiBaseResponse<LogoutResponse>,
    LogoutRequest,
    '/auth/logout'
  >({
    endPoint: '/auth/logout',
    queryKey: ['auth', 'logout'],
  })

  return { mLogin, mLogout }
}
