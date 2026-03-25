// utils/cookie.ts
interface CookieOptions {
  days?: number
  path?: string
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

export const CookieService = {
  set(name: string, value: string, options: CookieOptions = {}): void {
    if (typeof document === 'undefined') return

    const { days, path = '/', secure = false, sameSite = 'Lax' } = options

    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

    if (days) {
      const expires = new Date()
      expires.setTime(expires.getTime() + days * 864e5)
      cookie += `; expires=${expires.toUTCString()}`
    }

    cookie += `; path=${path}`
    cookie += `; SameSite=${sameSite}`

    if (secure) cookie += `; Secure`

    document.cookie = cookie
  },

  get(name: string): string | null {
    if (typeof document === 'undefined') return null

    const cookies = document.cookie.split('; ')
    const found = cookies.find((c) =>
      c.startsWith(`${encodeURIComponent(name)}=`),
    )

    return found ? decodeURIComponent(found.split('=')[1]) : null
  },

  remove(name: string, path = '/'): void {
    this.set(name, '', { days: -1, path })
  },
}
