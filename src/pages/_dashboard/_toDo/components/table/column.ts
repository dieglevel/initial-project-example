import type { Todo } from "@/api/schemas";
import type { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Todo>[] = [
	{
		accessorKey: "description",
		header: "Description",
	},
	{
		accessorKey: "isCompleted",
		header: "Completed",
		cell: ({ row }) => (row.original.isCompleted ? "Yes" : "No"),
	},
];
