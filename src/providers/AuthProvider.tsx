import React, { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useAuth, type AuthContextType } from "@/hooks/useAuth";
import { AppPaths } from "@/pages/appPaths";
import { Outlet, useNavigate } from "react-router-dom";

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const auth = useAuth();

	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// Hook to use the auth context
// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuthContext must be used within an AuthProvider");
	}
	return context;
};

// Higher-order component for protected routes
interface ProtectedRouteProps {
	fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	fallback = <div>Redirecting to login...</div>,
}) => {
	const navigate = useNavigate();

	const { isAuthenticated, isLoading } = useAuthContext();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen w-full">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (!isAuthenticated) {
		// Redirect to login
		navigate(AppPaths.auth.login);
		return <>{fallback}</>;
	}

	return <Outlet />;
};

// Higher-order component for public routes (login, register, etc.)
interface PublicRouteProps {
	fallback?: ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
	fallback = <div>Redirecting to dashboard...</div>,
}) => {
	const { isAuthenticated, isLoading } = useAuthContext();
	const navigate = useNavigate();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen w-full">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				<span className="ml-2">Đang kiểm tra...</span>
			</div>
		);
	}

	if (isAuthenticated) {
		// Redirect to dashboard if already authenticated
		navigate(AppPaths.dashboard.todoAntd);
		return <>{fallback}</>;
	}

	return <Outlet />;
};

// Component to show user info (for debugging/development)
export const UserInfo: React.FC = () => {
	const { user, isAuthenticated, accessToken } = useAuthContext();

	if (!isAuthenticated) {
		return <div>Not authenticated</div>;
	}

	return (
		<div className="p-4 bg-gray-100 rounded-lg">
			<h3 className="font-bold mb-2">User Information</h3>
			<p>
				<strong>ID:</strong> {user?.id}
			</p>
			<p>
				<strong>Username:</strong> {user?.username}
			</p>
			<p>
				<strong>Email:</strong> {user?.email}
			</p>
			<p>
				<strong>Role:</strong> {user?.role}
			</p>
			<p>
				<strong>Has Token:</strong> {accessToken ? "Yes" : "No"}
			</p>
		</div>
	);
};
