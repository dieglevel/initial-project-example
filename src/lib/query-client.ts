import { QueryClient } from "@tanstack/react-query";

import type { DefaultError, UseMutationOptions } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
		},
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
			console.error("❌ Global mutation error:", error);
			options?.onError?.(error, variables, context, mutation);
		},
		onSuccess: (data, variables, context, mutation) => {
			console.log("✅ Global mutation success:", data);
			queryClient.invalidateQueries(); // global invalidate
			options?.onSuccess?.(data, variables, context, mutation);
		},
	};
}
