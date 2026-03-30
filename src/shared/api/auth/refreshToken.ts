import axios from 'axios'
import type { AxiosResponse } from 'axios'
import type { ApiBaseResponse } from '../baseResponse'
import type { IUser } from '@/shared/auth/auth.type'

export type RefreshTokenResponse = ApiBaseResponse<{
  accessToken: string
  refreshToken: string
  user: IUser
}>

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
})

export const refreshTokenRequest = (
  refreshToken: string,
): Promise<AxiosResponse<RefreshTokenResponse>> =>
  refreshClient.post('auth/refresh-token', { refreshToken })
