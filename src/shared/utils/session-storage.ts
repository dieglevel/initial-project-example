type SessionData = {
  user: string
}

class SessionService {
  private storage: Storage

  constructor(useSessionStorage = true) {
    this.storage = useSessionStorage
      ? window.sessionStorage
      : window.localStorage
  }

  // Lưu một key vào session
  set(key: string, value: any) {
    try {
      const val = JSON.stringify(value)
      this.storage.setItem(key, val)
    } catch (error) {
      console.error('Failed to set session item', error)
    }
  }

  // Lấy một key từ session
  get<T = any>(key: string): T | null {
    try {
      const item = this.storage.getItem(key)
      return item ? (JSON.parse(item) as T) : null
    } catch (error) {
      console.error('Failed to parse session item', error)
      return null
    }
  }

  // Xoá một key
  remove(key: string) {
    this.storage.removeItem(key)
  }

  // Xoá toàn bộ session
  clear() {
    this.storage.clear()
  }

  // Kiểm tra key có tồn tại không
  has(key: string) {
    return this.storage.getItem(key) !== null
  }
}

// Singleton
export const sessionService = new SessionService()
