import type { AuthContextType } from "@/shared/hooks/use-auth";
import { createContext, useContext } from "react";

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
