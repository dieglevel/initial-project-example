import { useTodoControllerCreate } from "@/api/todo/todo";
import { Modal } from "antd";

import { Checkbox, Form, Input } from "antd";

interface CreateModalProps {
	isOpen: boolean;
	onClose: () => void;
}

interface FieldType {
	description: string;
	isCompleted: boolean;
}

export default function CreateModal({ isOpen, onClose }: CreateModalProps) {
	const { mutate } = useTodoControllerCreate();

	const [form] = Form.useForm();

	// useEffect(() => {
	// 	form.resetFields();
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [isOpen]);

	const onOk = async () => {
		try {
			const values = await form.validateFields();
			mutate(
				{
					data: {
						description: values.description,
						isCompleted: values.isCompleted,
					},
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
			title="Create Todo"
			open={isOpen}
			onCancel={onClose}
			onOk={onOk}
			okText="Create"
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
					initialValue={false}
				>
					<Checkbox>Are you done ?</Checkbox>
				</Form.Item>
				<Form.Item<FieldType>
					label="Description"
					name="description"
					rules={[
						{ required: true, message: "Please input the description!" },
					]}
				>
					<Input />
				</Form.Item>
			</Form>
		</Modal>
	);
}
