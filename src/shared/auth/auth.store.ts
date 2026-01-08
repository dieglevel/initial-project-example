// stores/auth.store.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface User {
  createdAt: string
  updatedAt: string
  deletedAt?: string
  id: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  avatar?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools((set) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,

    setAuth: (user, accessToken, refreshToken) =>
      set({ user, accessToken, refreshToken, isAuthenticated: true }),

    clearAuth: () =>
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      }),
  })),
)
