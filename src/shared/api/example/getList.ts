import type { UseQueryOptions } from '@tanstack/react-query'

import type { ApiBaseResponse } from '../baseResponse'
import type { Example } from './example.type'
import { useQueryGet } from '@/shared/lib/mutation/useQueryGet'

// GetList<Example>Params
export interface GetListParams {
  page?: number
  pageSize?: number
  search?: string
}

interface Props {
  queryParams?: Partial<GetListParams>
  options?: Omit<
    UseQueryOptions<ApiBaseResponse<Array<Example>>>,
    'queryKey' | 'queryFn'
  >
}

// useGetList<Example>
export const useGetList = ({ queryParams, options }: Props) =>
  useQueryGet<ApiBaseResponse<Array<Example>>, '/admin/examples'>({
    endPoint: '/admin/examples',
    queryKey: ['admin-examples', queryParams],
    queryParams,
    options,
  })

// Example usage (/admin/examples?search=example&page=1&pageSize=10)
useGetList({
  queryParams: {
    search: 'example',
    page: 1,
    pageSize: 10,
  },
})
