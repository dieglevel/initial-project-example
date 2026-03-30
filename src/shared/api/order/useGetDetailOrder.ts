import type { UseQueryOptions } from '@tanstack/react-query'

import type { ApiBaseResponse } from '../baseResponse'
import type { GetOrderDetailResponse } from './order.type'
import { useQueryGet } from '@/shared/lib/mutation/useQueryGet'

export interface GetOrderDetailParams {
  id: number
}

export const useGetOrderDetail = <
  TSearch extends Record<string, unknown> = {},
>({
  queryParams,
  options,
}: {
  options?: Omit<
    UseQueryOptions<ApiBaseResponse<GetOrderDetailResponse>>,
    'queryKey' | 'queryFn'
  >
  queryParams?: Partial<GetOrderDetailParams> & TSearch
}) =>
  useQueryGet<
    ApiBaseResponse<GetOrderDetailResponse>,
    '/admin/orders/:id',
    TSearch
  >({
    endPoint: '/admin/orders/:id',
    queryKey: ['admin-orders-detail', queryParams],
    pathParams: {
      id: queryParams?.id || '',
    },
    options,
  })
