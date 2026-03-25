// utils/localStorage.ts
export const LocalStorageService = {
  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, JSON.stringify(value))
  },

  get<T>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') return defaultValue ?? null

    const item = localStorage.getItem(key)
    if (!item) return defaultValue ?? null

    try {
      return JSON.parse(item) as T
    } catch {
      return defaultValue ?? null
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  },

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.clear()
  },
}
