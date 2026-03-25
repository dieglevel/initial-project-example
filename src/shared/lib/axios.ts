/* eslint-disable no-shadow */
import axios from 'axios'
import { useAuthStore } from '../store/auth.store'
import { AuthTokenService } from '../auth/authToken.service'
import { refreshTokenRequest } from '../api/auth/refreshToken'
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { RefreshTokenResponse } from '../api/auth/refreshToken'

let refreshPromise: Promise<AxiosResponse<RefreshTokenResponse>> | null = null

export const customAxios = <T = unknown>(
  config: AxiosRequestConfig,
): Promise<T> => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  })

  // Request interceptor to add authorization header
  instance.interceptors.request.use((config) => {
    const token = AuthTokenService.getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  // Response interceptor to handle token refresh and errors
  instance.interceptors.response.use(
    (response) => {
      return response
    },
    async (error: AxiosError) => {
      if (axios.isCancel(error)) {
        console.warn('Request cancelled:', error.message)
        return Promise.reject(error)
      }
      console.error('Axios Interceptor Error:', error)

      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        const originalRequest = error.config

        if (
          originalRequest?.url?.includes('auth/login') ||
          originalRequest?.url?.includes('auth/resident-login') ||
          originalRequest?.url?.includes('auth/refresh-token')
        ) {
          return Promise.reject(error)
        }

        if (originalRequest && !originalRequest.headers['x-refresh-retry']) {
          const refreshToken = AuthTokenService.getRefreshToken()

          if (!refreshToken) {
            AuthTokenService.clearTokens()
            useAuthStore.getState().clearAuth()

            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }

            return Promise.reject(error)
          }

          originalRequest.headers['x-refresh-retry'] = 'true'

          try {
            if (!refreshPromise) {
              refreshPromise = refreshTokenRequest(refreshToken)
            }

            const refreshResponse = await refreshPromise
            refreshPromise = null

            const {
              accessToken,
              refreshToken: newRefreshToken,
              user,
            } = refreshResponse.data.data

            AuthTokenService.setTokens(accessToken, newRefreshToken, user)
            useAuthStore.getState().setAuth({
              user,
              accessToken,
              refreshToken: newRefreshToken,
              isAuthenticated: true,
            })

            originalRequest.headers.Authorization = `Bearer ${accessToken}`

            return instance.request(originalRequest)
          } catch (refreshError) {
            refreshPromise = null
            AuthTokenService.clearTokens()
            useAuthStore.getState().clearAuth()

            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }

            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }

      // Handle other errors
      if (error.response?.status && error.response.status >= 500) {
        console.error('CRITICAL SERVER ERROR:', error.response.status)
      }

      return Promise.reject(error)
    },
  )

  return instance.request<T>(config).then((res) => res.data)
}
