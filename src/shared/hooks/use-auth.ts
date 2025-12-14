/* eslint-disable react-hooks/exhaustive-deps */
import {
	useAuthControllerLogOut,
	useAuthControllerSignIn,
} from "@/api/auth/auth";
import type {
	AuthControllerSignIn200,
	Profile,
	SignInDto,
	SignInDtoResponse,
} from "@/api/schemas";
import {
	STORAGE_KEYS,
	type StorageKeysType,
} from "@/shared/common/storage-keys.constant";
import { AppPaths } from "@/pages/appPaths";
import { useState, useEffect, useCallback, useMemo, use } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

export interface JwtPayload {
	sub: string;
	exp: number;
	iat: number;
}
export interface AuthState {
	accessToken: string | null;
	refreshToken: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

export interface AccountType {
	ADMINISTRATOR: "admin";
	RESIDENT: "resident";
}

export interface AuthContextType extends AuthState {
	login: (credentials: SignInDto) => Promise<void>;
	logout: () => Promise<void>;
	payload: JwtPayload | null;
}

// Token storage utilities
const TokenStorage = {
	set: ({ type, data }: { type: StorageKeysType; data: string }) => {
		try {
			localStorage.setItem(type, data);
		} catch (error) {
			console.error(`Failed to store ${type}:`, error);
		}
	},

	get: (type: StorageKeysType): string | null => {
		try {
			return localStorage.getItem(type);
		} catch (error) {
			console.error(`Failed to retrieve ${type}:`, error);
			return null;
		}
	},

	clear: (type: StorageKeysType) => {
		try {
			localStorage.removeItem(type);
		} catch (error) {
			console.error(`Failed to clear ${type}:`, error);
		}
	},

	clearAll: () => {
		try {
			Object.values(STORAGE_KEYS).forEach((key) => {
				localStorage.removeItem(key);
			});
		} catch (error) {
			console.error("Failed to clear auth storage:", error);
		}
	},
};

// Token validation utilities
const TokenUtils = {
	isTokenExpired: (token: string): boolean => {
		try {
			const payload = JSON.parse(atob(token.split(".")[1]));
			const currentTime = Date.now() / 1000;
			return payload.exp < currentTime;
		} catch (error) {
			console.error("Failed to decode token:", error);
			return true;
		}
	},

	getTokenPayload: (token: string): JwtPayload | null => {
		try {
			return JSON.parse(atob(token.split(".")[1]));
		} catch (error) {
			console.error("Failed to decode token payload:", error);
			return null;
		}
	},
};

// Create Auth Context
// const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook
export const useAuth = () => {
	const [authState, setAuthState] = useState<AuthState>({
		accessToken: TokenStorage.get(STORAGE_KEYS.ACCESS_TOKEN),
		refreshToken: TokenStorage.get(STORAGE_KEYS.REFRESH_TOKEN),
		isAuthenticated: false,
		isLoading: true,
	});
	const navigate = useNavigate();

	// API mutations
	const loginMutation = useAuthControllerSignIn({
		mutation: {
			onSuccess: (data) => {
				loginSuccess(data.data);
				message.success("Đăng nhập thành công!");
			},
			onError: () => {
				message.error("Đăng nhập thất bại.");
			},
		},
	});

	const logoutMutation = useAuthControllerLogOut({
		mutation: {
			onSuccess: () => {
				TokenStorage.clearAll();
				setAuthState({
					accessToken: null,
					refreshToken: null,
					isAuthenticated: false,
					isLoading: false,
				});
				navigate(AppPaths.auth.login);
				message.success("Đăng xuất thành công!");
			},
			onError: (error) => {
				console.error("Logout failed:", error);
			},
		},
	});

	const login = useCallback(async (credentials: SignInDto) => {
		await loginMutation.mutateAsync({
			data: credentials,
		});
	}, []);

	const loginSuccess = useCallback(async (response: SignInDtoResponse) => {
		const { accessToken, refreshToken } = response;

		TokenStorage.set({ type: STORAGE_KEYS.ACCESS_TOKEN, data: accessToken });
		TokenStorage.set({
			type: STORAGE_KEYS.REFRESH_TOKEN,
			data: refreshToken,
		});

		setAuthState((prev) => ({
			...prev,
			accessToken,
			refreshToken,
			isAuthenticated: true,
			isLoading: false,
		}));

		navigate(AppPaths.dashboard.dashboard);
	}, []);

	const logout = useCallback(async () => {
		await logoutMutation.mutateAsync();
	}, []);

	useEffect(() => {
		// On mount, check for tokens in storage
		const accessToken = TokenStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
		const refreshToken = TokenStorage.get(STORAGE_KEYS.REFRESH_TOKEN);

		if (
			accessToken &&
			refreshToken &&
			!TokenUtils.isTokenExpired(accessToken)
		) {
			setAuthState({
				accessToken,
				refreshToken,
				isAuthenticated: true,
				isLoading: false,
			});
		} else {
			TokenStorage.clearAll();
			setAuthState({
				accessToken: null,
				refreshToken: null,
				isAuthenticated: false,
				isLoading: false,
			});
		}
	}, []);

	const payload = useMemo(() => {
		if (authState.accessToken) {
			return TokenUtils.getTokenPayload(authState.accessToken);
		}
		return null;
	}, [authState]);

	return {
		...authState,
		login,
		logout,
		payload,
	};
};
