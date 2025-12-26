import { AppPaths } from "@/pages/appPaths";
import { Flex, Spin } from "antd";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/use-auth";

export const PublicRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: "100vh" }}>
        <Spin />
      </Flex>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={AppPaths.dashboard.dashboard} replace />;
  }

  return <Outlet />;
};
