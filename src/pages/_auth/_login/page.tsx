import type { SignInDto } from "@/api";
import type { WriteItemProps } from "@/shared/components/WriteItem";
import WriteItem from "@/shared/components/WriteItem";
import { useAuth } from "@/shared/hooks/use-auth";
import { Button, Card, Flex, Form, Input, message } from "antd";
import { useForm } from "antd/es/form/Form";

type SignInField = WriteItemProps<React.ElementType, SignInDto>;

export default function LoginPage() {
	const [form] = useForm<SignInDto>();

	const { login } = useAuth();

	const field: SignInField[] = [
		{
			form: {
				label: "Identifier",
				name: "identifier",
				rules: [
					{ required: true, message: "Please input your identifier!" },
				],
			},
			component: Input,
			componentProps: {
				placeholder: "Username or Email",
			},
		} as WriteItemProps<typeof Input, SignInDto>,
		{
			form: {
				label: "Password",
				name: "password",
				rules: [{ required: true, message: "Please input your password!" }],
			},
			component: Input.Password,
			componentProps: {},
		} as WriteItemProps<typeof Input.Password, SignInDto>,
	];

	const handleLogin = async (values: SignInDto) => {
		await login(values);
	};

	return (
		<Flex
			justify="center"
			align="center"
			style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}
		>
			<Card title="Login" style={{ width: 400 }}>
				<Form layout="vertical" form={form} onFinish={handleLogin}>
					{field.map((item, index) => (
						<WriteItem key={index} {...item} />
					))}
					<Form.Item>
						<Button
							htmlType="submit"
							type="primary"
							style={{
								width: "100%",
							}}
						>
							Login
						</Button>
					</Form.Item>
				</Form>
			</Card>
		</Flex>
	);
}
