import type { IUser } from '@/shared/auth/auth.type'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: IUser
}

export interface LogoutRequest {}

export interface LogoutResponse {}
