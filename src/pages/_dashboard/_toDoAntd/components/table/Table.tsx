import { Table } from "antd";

import type { Todo } from "@/api/schemas";
import {
	useTodoControllerGetPaging,
	useTodoControllerUpdate,
} from "@/api/todo/todo";
import { useState } from "react";
import UpdateModal from "./UpdateModal";
import { getTodoColumns } from "./column";
import DeleteModal from "./DeleteModal";
import { useTodoStore } from "../../store/todo.slice";

export default function ToDoTable() {
	// const { data } = useTodoControllerGetAll();
	const { paging, setPaging } = useTodoStore();
	const { data, isLoading } = useTodoControllerGetPaging({
		page: paging.page,
		limit: paging.limit,
		search: paging.search,
		searchFields: paging.searchFields,
		sort: paging.sort,
	});
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
	const { mutate } = useTodoControllerUpdate();

	const onEdit = (todo: Todo) => {
		setIsModalOpen(true);
		setSelectedTodo(todo);
	};

	const onDelete = (todo: Todo) => {
		setSelectedTodo(todo);
		setIsDeleteModalOpen(true);
	};

	const onFastClickComplete = (todo: Todo) => {
		mutate({
			data: {
				description: todo.description,
				isCompleted: !todo.isCompleted,
			},
			id: todo.id,
		});
	};

	const columns = getTodoColumns(onFastClickComplete, onEdit, onDelete);

	return (
		<>
			<Table
				rowKey={"id"}
				dataSource={data?.data?.items || []}
				columns={columns}
				pagination={{
					pageSize: data?.data?.itemsPerPage,
					current: data?.data?.currentPage,
					total: data?.data?.totalItems,
					onChange: (page, pageSize) => {
						setPaging({ ...paging, page, limit: pageSize });
					},
					pageSizeOptions: ["5", "10", "20", "50"],
					onShowSizeChange: (current, size) => {
						setPaging({ ...paging, page: current, limit: size });
					},
				}}
				loading={isLoading}
			/>

			<UpdateModal
				todo={selectedTodo}
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
			/>

			<DeleteModal
				todo={selectedTodo}
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
			/>
		</>
	);
}
