export const AUTH_TOKEN_KEY = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'auth_user',
}

export interface IUser {
  id: number
  email: string
  fullName: string
  role: UserRoleEnum
}

export enum UserRoleEnum {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

export const UserRoleMapper: Record<keyof typeof UserRoleEnum, string> = {
  CUSTOMER: 'Khách hàng',
  ADMIN: 'Quản trị viên',
}
