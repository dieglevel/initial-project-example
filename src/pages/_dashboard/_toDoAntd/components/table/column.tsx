import type { Todo } from "@/api/schemas";
import { Button, type TableProps } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

export const getTodoColumns = (
	onFastClickComplete: (todo: Todo) => void,
	onEdit: (todo: Todo) => void,
	onDelete: (todo: Todo) => void,
): TableProps<Todo>["columns"] => [
	{
		title: "Description",
		dataIndex: "description",
		key: "description",
	},
	{
		title: "Completed",
		dataIndex: "isCompleted",
		key: "isCompleted",
		render: (_, record) => {
			return (
				<Button onClick={() => onFastClickComplete(record)}>
					<p
						className={`font-medium ${
							record.isCompleted ? "text-green-600" : "text-red-600"
						}`}
					>
						{record.isCompleted ? "Yes" : "No"}
					</p>
				</Button>
			);
		},
	},
	{
		title: "Actions",
		key: "actions",
		render: (_, record) => {
			return (
				<div className="flex gap-2">
					<Button
						type="default"
						shape="circle"
						icon={<EditOutlined />}
						onClick={() => onEdit(record)}
					/>
					<Button
						type="default"
						shape="circle"
						danger
						icon={<DeleteOutlined />}
						onClick={() => onDelete(record)}
					/>
				</div>
			);
		},
	},
];