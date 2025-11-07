import type { Todo } from "@/api/schemas";
import { useTodoControllerUpdate } from "@/api/todo/todo";
import { Modal } from "antd";

import { Checkbox, Form, Input } from "antd";
import { useEffect } from "react";

interface UpdateModalProps {
	todo: Todo | null;
	isOpen: boolean;
	onClose: () => void;
}

interface FieldType {
	description: string;
	isCompleted: boolean;
}

export default function UpdateModal({
	todo,
	isOpen,
	onClose,
}: UpdateModalProps) {
	const { mutate } = useTodoControllerUpdate();

	const [form] = Form.useForm();

	useEffect(() => {
		if (todo) form.setFieldsValue(todo);
	}, [todo]);

	const onOk = async () => {
		try {
			const values = await form.validateFields();
			mutate(
				{
					data: {
						description: values.description,
						isCompleted: values.isCompleted,
					},
					id: todo?.id || "",
				},
				{
					onSuccess: () => {
						onClose();
					},
				},
			);
		} catch (error) {
			console.error("Validation failed:", error);
		}
	};

	return (
		<Modal
			title="Update Todo"
			open={isOpen}
			onCancel={onClose}
			onOk={onOk}
			okText="Update"
			cancelText="Cancel"
		>
			<Form
				form={form}
				name="basic"
				wrapperCol={{ span: 16 }}
				style={{ maxWidth: 600 }}
				autoComplete="off"
			>
				<Form.Item<FieldType>
					name="isCompleted"
					valuePropName="checked"
					label={null}
					initialValue={todo?.isCompleted}
				>
					<Checkbox>Are you done ?</Checkbox>
				</Form.Item>
				<Form.Item<FieldType>
					label="Description"
					name="description"
					rules={[
						{ required: true, message: "Please input the description!" },
					]}
					initialValue={todo?.description}
				>
					<Input />
				</Form.Item>
			</Form>
		</Modal>
	);
}
