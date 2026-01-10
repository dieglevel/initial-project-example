/* eslint-disable no-shadow */
import axios from 'axios'
import { useAuthStore } from '../store/auth.store'
import { AuthTokenService } from '../auth/authToken.service'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import { useProfileControllerMe } from '@/api'

export const customAxios = <T = unknown>(
  config: AxiosRequestConfig,
): Promise<T> => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  })

  // Request interceptor to add authorization header
  instance.interceptors.request.use(async (config) => {
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
      // console.error("Axios Interceptor Error:", error);
      // console.error(
      // 	"Axios Error:",
      // 	JSON.stringify(error.response?.data, null, 1),
      // );

      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        // Don't interfere with login endpoints
        if (
          error.config?.url?.includes('/api/auth/sign-in') ||
          error.config?.url?.includes('/api/auth/resident-login')
        ) {
          return Promise.reject(error)
        }

        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
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
