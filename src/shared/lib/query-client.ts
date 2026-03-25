import { QueryClient } from '@tanstack/react-query'

import { getMessageInstance } from '../utils/message-instance'
import type { DefaultError, UseMutationOptions } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: false,
    },
    mutations: withMutationOptions(),
  },
})

export function withMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options?: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationOptions<TData, TError, TVariables, TContext> {
  return {
    ...options,
    onError: (error, variables, context, mutation) => {
      const errorAxios = error as AxiosError

      const message = getMessageInstance()
      switch (errorAxios.response?.status) {
        case 400:
          message.error('Bad request. Please check your input and try again.')
          break
        case 401:
          message.error('Unauthorized. Please log in to continue.')
          break
        case 403:
          message.error(
            'Forbidden. You do not have permission to perform this action.',
          )
          break
        case 404:
          message.error('Not found. The requested resource could not be found.')
          break
        case 500:
          message.error('Server error. Please try again later.')
          break
        default:
          console.error('Unhandled error:', error)
          message.error('An error occurred during the operation.')
      }

      options?.onError?.(error, variables, context, mutation)
    },
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries() // global invalidate
      options?.onSuccess?.(data, variables, context, mutation)
    },
  }
}
