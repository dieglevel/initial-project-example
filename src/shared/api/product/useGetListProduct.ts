import type { UseQueryOptions } from '@tanstack/react-query'
import type {
  GetProductsResponse,
  ProductStatusEnum,
  Product_TypeEnum,
} from './product.type'
import type { ApiBaseResponse } from '../baseResponse'
import { useQueryGet } from '@/shared/lib/mutation/useQueryGet'

export interface GetListProductParams {
  keyword?: string
  status?: ProductStatusEnum
  type?: Product_TypeEnum
  minPrice?: number
  maxPrice?: number
  page?: number
  size?: number
}

export const useGetListProduct = <
  TSearch extends Record<string, unknown> = {},
>({
  queryParams,
  options,
}: {
  options?: Omit<
    UseQueryOptions<ApiBaseResponse<GetProductsResponse>>,
    'queryKey' | 'queryFn'
  >
  queryParams?: Partial<GetListProductParams> & TSearch
}) =>
  useQueryGet<ApiBaseResponse<GetProductsResponse>, '/admin/products', TSearch>(
    {
      endPoint: '/admin/products',
      queryKey: ['admin-products', queryParams],
      queryParams,
      options,
    },
  )
