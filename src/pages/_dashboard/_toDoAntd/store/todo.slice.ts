import type { TodoControllerGetPagingParams } from "@/api/schemas";
import { create } from "zustand";

interface TodoState {
	paging: TodoControllerGetPagingParams;
	setPaging: (paging: TodoControllerGetPagingParams) => void;
}

export const useTodoStore = create<TodoState>((set) => ({
	paging: {
		page: 1,
		limit: 5,
		search: "",
		searchFields: ["description"],
		sort: [],
	},
	setPaging: (paging: TodoControllerGetPagingParams) => set({ paging }),
}));
