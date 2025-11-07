import type { Todo } from "@/api/schemas";
import { useTodoControllerDelete } from "@/api/todo/todo";
import { Modal } from "antd";
import { toast } from "sonner";

interface DeleteModalProps {
	todo: Todo | null;
	isOpen: boolean;
	onClose: () => void;
}

export default function DeleteModal({
	todo,
	isOpen,
	onClose,
}: DeleteModalProps) {
	const { mutate } = useTodoControllerDelete();

	const handleDelete = () => {
		if (todo) {
			mutate(
				{
					id: todo.id,
				},
				{
					onSuccess: () => {
						toast.success("Todo deleted successfully");
						onClose();
					},
				},
			);
		}
	};

	return (
		<Modal
			title="Delete Todo"
			open={isOpen}
			onCancel={onClose}
			onOk={() => {
				handleDelete();
			}}
		>
			<p>Are you sure you want to delete this todo?</p>
			{todo && <p>{todo.description}</p>}
		</Modal>
	);
}
