import { Button } from "@heroui/react";

export function About() {
	const apiUrl = import.meta.env.VITE_API_URL;
	return (
		<div className="flex h-screen items-center justify-center">
			<h1 className="text-4xl font-bold">About Page</h1>
			<Button>{apiUrl}</Button>
		</div>
	);
}
