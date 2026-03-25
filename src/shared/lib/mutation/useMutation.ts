import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buildUrl, invalidate } from './helper'
import type { BaseMutationProps, MutatePayload } from './helper'
import { customAxios } from '@/shared/lib/axios'

function createMutationHook(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE') {
  return function useCustomMutation<
    TResponse,
    TBody = unknown,
    TEndPoint extends string = string,
    TQueryParams extends Record<string, unknown> = {},
  >({
    endPoint,
    queryKey,
    pathParams,
    queryParams,
    options,
  }: BaseMutationProps<TResponse, TBody, TEndPoint, TQueryParams>) {
    const queryClient = useQueryClient()
    const userOnSuccess = options?.onSuccess

    return useMutation<
      TResponse,
      unknown,
      MutatePayload<TBody, TEndPoint, TQueryParams>
    >({
      ...options,

      mutationFn: async (payload) => {
        const finalUrl = buildUrl(endPoint, payload.pathParams ?? pathParams)

        return customAxios<TResponse>({
          url: finalUrl,
          method,
          data: payload.body,
          params: {
            ...queryParams,
            ...payload.queryParams,
          },
        })
      },

      onSuccess: (data, variables, context, mutation) => {
        invalidate(queryClient, queryKey)
        userOnSuccess?.(data, variables, context, mutation)
      },
    })
  }
}

export const useMutationPost = createMutationHook('POST')
export const useMutationPut = createMutationHook('PUT')
export const useMutationPatch = createMutationHook('PATCH')
export const useMutationDelete = createMutationHook('DELETE')
