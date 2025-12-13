import type { SignInDto } from "@/api";
import type { WriteItemProps } from "@/shared/components/WriteItem";
import WriteItem from "@/shared/components/WriteItem";
import { useAuth } from "@/shared/hooks/use-auth";
import { Button, Flex, Form, Input, message } from "antd";
import { useForm } from "antd/es/form/Form";

type SignInField<T extends React.ElementType> = WriteItemProps<T, SignInDto>;

type AnySignInField = WriteItemProps<React.ElementType, SignInDto>;

export default function LoginPage() {
	const [form] = useForm<SignInDto>();

	const hanleTest = () => {
		message.success("Test button clicked!");
	};

	const { login } = useAuth();

	const field: AnySignInField[] = [
		{
			form: {
				label: "Identifier",
				name: "identifier",
				rules: [{ required: true }],
			},
			component: Input,
			componentProps: {},
		} as WriteItemProps<typeof Input, SignInDto>,
		{
			form: {
				label: "Password",
				name: "password",
				rules: [{ required: true }],
			},
			component: Input,
			componentProps: {
				visibilityToggle: true,
			},
		},
	];

	const handleLogin = async (values: SignInDto) => {
		await login(values);
	};

	return (
		<Flex justify="center" align="center" style={{ minHeight: "100vh" }}>
			<Form layout="vertical" form={form} onFinish={handleLogin}>
				{field.map((item, index) => (
					<WriteItem key={index} {...item} />
				))}
				<Form.Item>
					<Button htmlType="submit" type="primary">
						Login
					</Button>
				</Form.Item>
			</Form>
		</Flex>
	);
}
