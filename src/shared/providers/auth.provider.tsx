import { AppPaths } from "@/pages/appPaths";
import type { ReactNode } from "react";
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthContext } from "./auth.context";

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
