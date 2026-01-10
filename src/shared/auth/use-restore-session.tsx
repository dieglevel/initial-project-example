import { useEffect } from 'react'
import { customAxios } from '../lib/axios'
import { useAuthStore } from '../store/auth.store'
import { useProfileControllerMe } from '@/api'

export function useRestoreSession() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const { data, isError } = useProfileControllerMe()
}
