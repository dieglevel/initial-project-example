import React from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/shared/hooks/use-auth";
import { AuthContext } from "./auth.context";

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const auth = useAuth();
	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
