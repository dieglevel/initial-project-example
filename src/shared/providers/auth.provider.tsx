import { AppPaths } from "@/pages/appPaths";
import type { ReactNode } from "react";
import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthContext } from "./auth.context";
import { useAuth } from "../hooks/use-auth";
import { Flex, Spin } from "antd";

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
			<Flex justify="center" align="center" style={{ minHeight: "100vh" }}>
				<Spin />
			</Flex>
		);
	}

	return <Outlet />;
};

export const PublicRoute: React.FC = () => {
	const navigate = useNavigate();
	const { isAuthenticated, isLoading } = useAuthContext();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			navigate(AppPaths.dashboard.dashboard);
		}
	}, [isAuthenticated, isLoading]);

	if (isLoading) {
		return (
			<Flex justify="center" align="center" style={{ minHeight: "100vh" }}>
				<Spin />
			</Flex>
		);
	}

	if (isAuthenticated) {
		return null;
	}
	return <Outlet />;
};
