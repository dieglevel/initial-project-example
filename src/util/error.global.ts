import type { BadRequestResponseDto } from "@/api/schemas";
import { addToast } from "@heroui/react";
import type { AxiosError } from "axios";
import type { Dispatch } from "react";

export const handleError = (
	error: unknown,
	setError?: Dispatch<React.SetStateAction<Record<string, string>>>,
) => {
	console.error("Error creating account:", error);

	const e = error as AxiosError<BadRequestResponseDto>;

	if (e.status === 400) {
		const badResponse = e.response?.data;

		addToast({
			title: "Error",
			description: badResponse?.message ?? "Unknown error occurred.",
			color: "danger",
		});

		if (badResponse?.errors) {
			const fieldErrors = Object.fromEntries(
				badResponse.errors.map((err) => [
					err.field,
					err.messages.join(", "),
				]),
			);
			setError && setError(fieldErrors);
		}
	} else {
		addToast({
			title: "Error",
			description: "An unexpected error occurred.",
			color: "danger",
		});
		setError && setError({});
	}
};
