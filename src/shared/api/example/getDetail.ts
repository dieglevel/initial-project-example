import type { UseQueryOptions } from '@tanstack/react-query'

import type { ApiBaseResponse } from '../baseResponse'
import type { Example } from './example.type'
import { useQueryGet } from '@/shared/lib/mutation/useQueryGet'

// Get<Example><Type>Params
export interface GetParams {
  page?: number
  pageSize?: number
  search?: string
}

interface Props {
  queryParams?: Partial<GetParams>
  pathParams: {
    id: number
  }
  options?: Omit<
    UseQueryOptions<ApiBaseResponse<Example>>,
    'queryKey' | 'queryFn'
  >
}

// useGet<Example><Type>
export const useGet = ({ queryParams, pathParams, options }: Props) =>
  useQueryGet<ApiBaseResponse<Example>, '/admin/examples/:id'>({
    endPoint: `/admin/examples/:id`,
    queryKey: ['admin-examples', pathParams.id, queryParams],
    pathParams,
    queryParams,
    options,
  })

// Example usage (/admin/examples/1?search=example&page=1&pageSize=10)
useGet({
  pathParams: {
    id: 1,
  },
  queryParams: {
    search: 'example',
    page: 1,
    pageSize: 10,
  },
})
