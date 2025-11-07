import { usePaymentControllerPayment } from "@/api/payment/payment";
import type { PaymentDto } from "@/api/schemas";
import { Button, Form, Input, InputNumber } from "antd";
import { toast } from "sonner";
export default function PaymentForm() {
	const { mutate } = usePaymentControllerPayment();

	const [form] = Form.useForm<PaymentDto>();

	const onFinish = async () => {
		const values = await form.validateFields();
		mutate(
			{
				data: {
					amount: values.amount,
					cardReceive: values.cardReceive,
				},
			},
			{
				onSuccess: () => {
					toast.success("Payment successful!");
					form.resetFields();
				},
				onError: () => {
					toast.error(`Payment failed`);
					form.resetFields();
				},
			},
		);
	};

	return (
		<Form form={form} layout="vertical">
			<Form.Item<PaymentDto>
				name="amount"
				label="Amount"
				rules={[{ required: true, message: "Please enter an amount" }]}
			>
				<InputNumber />
			</Form.Item>
			<Form.Item<PaymentDto>
				name="cardReceive"
				label="Card Receive"
				rules={[{ required: true, message: "Please enter a card receive" }]}
			>
				<Input />
			</Form.Item>

			<Button type="primary" onClick={onFinish}>
				Pay Now
			</Button>
		</Form>
	);
}
