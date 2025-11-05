import { useAuthControllerSignIn } from "@/api/auth/auth";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import type { SignInDto } from "@/api/schemas";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { STORAGE_KEYS } from "@/lib/axios.config";

const registerSchema = z.object({
	identifier: z.string().min(1, { message: "Identifier is required" }),
	password: z
		.string()
		.min(6, { message: "Password must be at least 6 characters long" }),
});

export default function LoginForm() {
	const { mutate } = useAuthControllerSignIn();

	const form = useForm<SignInDto>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			identifier: "",
			password: "",
		},
	});

	const handleSubmit = (data: SignInDto) => {
		mutate(
			{
				data,
			},
			{
				onSuccess(data) {
					localStorage.setItem(
						STORAGE_KEYS.ACCESS_TOKEN,
						data.data?.accessToken || "",
					);
				},
			},
		);
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
