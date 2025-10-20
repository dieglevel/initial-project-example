import { useAuth } from "@/hooks/useAuth";

export const AuthDebug = () => {
	const { isAuthenticated, isLoading, user, accessToken } = useAuth();

	return (
		<div className="fixed top-4 right-4 bg-white p-4 border rounded shadow-lg text-sm max-w-xs">
			<h3 className="font-bold mb-2">Auth Debug</h3>
			<div className="space-y-1">
				<p>
					<strong>Loading:</strong> {isLoading ? "Yes" : "No"}
				</p>
				<p>
					<strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
				</p>
				<p>
					<strong>User ID:</strong> {user?.id || "None"}
				</p>
				<p>
					<strong>Username:</strong> {user?.username || "None"}
				</p>
				<p>
					<strong>Role:</strong> {user?.role || "None"}
				</p>
				<p>
					<strong>Has Token:</strong> {accessToken ? "Yes" : "No"}
				</p>
			</div>
		</div>
	);
};
