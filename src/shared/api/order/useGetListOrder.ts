import type { UseQueryOptions } from '@tanstack/react-query'

import type { ApiBaseResponse } from '../baseResponse'
import type { GetOrdersResponse } from './order.type'
import { useQueryGet } from '@/shared/lib/mutation/useQueryGet'

export interface GetListOrderParams {}

export const useGetListOrder = <TSearch extends Record<string, unknown> = {}>({
  queryParams,
  options,
}: {
  options?: Omit<
    UseQueryOptions<ApiBaseResponse<GetOrdersResponse>>,
    'queryKey' | 'queryFn'
  >
  queryParams?: Partial<GetListOrderParams> & TSearch
}) =>
  useQueryGet<ApiBaseResponse<GetOrdersResponse>, '/admin/orders', TSearch>({
    endPoint: '/admin/orders',
    queryKey: ['admin-orders', queryParams],
    queryParams,
    options,
  })

  