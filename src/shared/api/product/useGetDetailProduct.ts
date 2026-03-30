import type { UseQueryOptions } from '@tanstack/react-query'
import type {
  ProductAvailabilityEnum,
  ProductStatusEnum,
  ProductTagEnum,
  Product_TypeEnum,
} from './product.type'
import type { ApiBaseResponse } from '../baseResponse'
import type { Configs } from '@/shared/pages/product/write/form.type'
import { useQueryGet } from '@/shared/lib/mutation/useQueryGet'

export interface GetDetailProductResponse {
  id: number
  name: string
  alias: string
  price: number
  compareAtPrice: number
  inventoryQuantity: number
  isCustomizable: boolean
  content: string
  summary: string
  thumbnail: string
  status: ProductStatusEnum
  type: Product_TypeEnum
  availability: ProductAvailabilityEnum
  tag: ProductTagEnum
  images: Array<string>
  options: Array<unknown>
  variants: Array<unknown>
  configs: Array<Configs>
}

export interface GetDetailProductParams {
  identifier: string
}

export const useGetDetailProduct = <
  TSearch extends Record<string, unknown> = {},
>({
  queryParams,
  options,
}: {
  options?: Omit<
    UseQueryOptions<ApiBaseResponse<GetDetailProductResponse>>,
    'queryKey' | 'queryFn'
  >
  queryParams?: Partial<GetDetailProductParams> & TSearch
}) =>
  useQueryGet<
    ApiBaseResponse<GetDetailProductResponse>,
    '/admin/products/:identifier',
    TSearch
  >({
    endPoint: '/admin/products/:identifier',
    queryKey: ['admin-detail-product'],
    pathParams: {
      identifier: queryParams?.identifier || '',
    },

    options,
  })
