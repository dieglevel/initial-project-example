export const AUTH_TOKEN_KEY = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'auth_user',
}

export interface IUser {
  id: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  avatar?: string
}
