import { AppPaths } from "@/pages/appPaths";
import { useAuth } from "@/shared/auth/use-auth";
import { Flex, Spin } from "antd";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: "100vh" }}>
        <Spin />
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={AppPaths.auth.login} replace />;
  }

  return <Outlet />;
};

