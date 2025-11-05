import { QueryClient } from "@tanstack/react-query";

import type { DefaultError, UseMutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
		},
		mutations: withMutationOptions(),
	},
});

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
			toast.error("An error occurred during the operation.", {
				description: (error as AxiosError).message,
			});
			options?.onError?.(error, variables, context, mutation);
		},
		onSuccess: (data, variables, context, mutation) => {
			queryClient.invalidateQueries(); // global invalidate
			options?.onSuccess?.(data, variables, context, mutation);
		},
	};
}
