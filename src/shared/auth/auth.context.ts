import type { SignInDto } from "@/api";
import { createContext } from "react";

export interface JwtPayload {
  id: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: SignInDto) => Promise<void>;
  logout: () => Promise<void>;
  payload: JwtPayload | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);
