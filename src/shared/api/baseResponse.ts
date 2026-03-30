export interface ApiBaseResponse<T> {
  code: number
  message: string
  timestamp: string
  path: string
  data: T
}

export interface ApiBasePage {
  number: number
  size: number
  totalElements: number
  totalPages: number
}
