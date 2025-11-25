import { AppPaths } from "@/pages/appPaths";
import type { ReactNode } from "react";
import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthContext } from "./auth.context";
import { useAuth } from "../hooks/use-auth";
import { Spinner } from "../components/ui/spinner";

export const ProtectedRoute: React.FC = () => {
	const navigate = useNavigate();
	const { isAuthenticated, isLoading } = useAuth();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			navigate(AppPaths.auth.login);
		}
	}, [isAuthenticated, isLoading]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen w-full">
				<Spinner />
			</div>
		);
	}

	return <Outlet />;
};

export const PublicRoute: React.FC = () => {
	const navigate = useNavigate();
	const { isAuthenticated, isLoading } = useAuthContext();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			navigate(AppPaths.dashboard._prefix);
		}
	}, [isAuthenticated, isLoading]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen w-full gap-3">
				<Spinner />
			</div>
		);
	}

	if (isAuthenticated) {
		return null;
	}
	return <Outlet />;
};
