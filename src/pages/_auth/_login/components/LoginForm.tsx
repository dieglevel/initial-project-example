import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";

import type { SignInDto } from "@/api/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const registerSchema = z.object({
	identifier: z.string().min(1, { message: "Identifier is required" }),
	password: z
		.string()
		.min(6, { message: "Password must be at least 6 characters long" }),
});

export default function LoginForm() {
	const { login } = useAuth();

	const form = useForm<SignInDto>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			identifier: "",
			password: "",
		},
	});

	const handleSubmit = (data: SignInDto) => {
		login(data);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="identifier"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tên đăng nhập</FormLabel>
							<FormControl>
								<Input placeholder="Tên đăng nhập" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Mật khẩu</FormLabel>
							<FormControl>
								<Input
									type="password"
									placeholder="Mật khẩu"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" className="w-full">
					Đăng nhập
				</Button>
			</form>
		</Form>
	);
}
