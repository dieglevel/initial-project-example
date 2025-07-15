"use client";

import { useAuthControllerCreate, useAuthControllerGetSomething } from "@/api";
import type { BadRequestResponseDto } from "@/api/schemas";
import { handleError } from "@/util/error.global";
import { addToast, Button, Form, Input } from "@heroui/react";
import type { AxiosError } from "axios";
import { useState, type FormEvent } from "react";

export default function Home() {
	const { data, isLoading } = useAuthControllerGetSomething();
	const { mutate } = useAuthControllerCreate();
	const [error, setError] = useState<Record<string, string>>({});

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const data = Object.fromEntries(new FormData(e.currentTarget));

		const email = data.email as string;
		const password = data.password as string;
		const phone = data.phone as string;

		console.log("data", data);

		mutate(
			{
				data: { email, password, phone },
			},
			{
				onSuccess: () => {
					addToast({
						title: "Success",
						description: "Account created successfully!",
						color: "success",
					});
				},

				onError: (e) => {
					handleError(e, setError);
				},
			},
		);
	};

	return (
		<Form
			validationBehavior="aria"
			onSubmit={onSubmit}
			validationErrors={error}
		>
			{data && (
				<div>
					<h1>Data from API:</h1>
					<pre>{JSON.stringify(data, null, 2)}</pre>
				</div>
			)}
			<Input name="email" label="Email" />
			<Input name="password" label="Password" />
			<Input name="phone" label="Phone" />
			<Button type="submit"> submit</Button>
		</Form>
		// <>
		// 	{isLoading && <p>Loading...</p>}

		// 	<Form>
		// 		<Input name="email" label="Email" />
		// 		<Input name="password" label="Password" />
		// 		<Input name="phone" label="Phone" />
		// 		<Button type="submit">Submit</Button>
		// 	</Form>
		// </>
	);
}
