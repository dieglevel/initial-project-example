/* eslint-disable react-hooks/exhaustive-deps */
import {
	useAuthControllerLogOut,
	useAuthControllerSignIn,
} from "@/api/auth/auth";
import type { AuthControllerSignIn200, SignInDto } from "@/api/schemas";
import { STORAGE_KEYS } from "@/shared/common/storage-keys.constant";
import { AppPaths } from "@/pages/appPaths";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Types
export interface User {
	id: string;
	email?: string;
	username?: string;
	role: "admin" | "resident";
	profile?: {
		firstName?: string;
		lastName?: string;
		avatar?: string;
	};
}

export interface AuthState {
	accessToken: string | null;
	refreshToken: string | null;
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

export interface AuthContextType extends AuthState {
	login: (credentials: SignInDto) => Promise<void>;
	logout: () => Promise<void>;
	refreshAccessToken: () => Promise<void>;
	clearAuth: () => void;
	updateUser: (user: Partial<User>) => void;
}

// Token storage utilities
const TokenStorage = {
	setAccessToken: (token: string) => {
		try {
			localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
		} catch (error) {
			console.error("Failed to store access token:", error);
		}
	},

	getAccessToken: (): string | null => {
		try {
			return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
		} catch (error) {
			console.error("Failed to retrieve access token:", error);
			return null;
		}
	},

	setRefreshToken: (token: string) => {
		try {
			localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
		} catch (error) {
			console.error("Failed to store refresh token:", error);
		}
	},

	getRefreshToken: (): string | null => {
		try {
			return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
		} catch (error) {
			console.error("Failed to retrieve refresh token:", error);
			return null;
		}
	},

	setUserData: (user: User) => {
		try {
			localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
		} catch (error) {
			console.error("Failed to store user data:", error);
		}
	},

	getUserData: (): User | null => {
		try {
			const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
			return userData ? JSON.parse(userData) : null;
		} catch (error) {
			console.error("Failed to retrieve user data:", error);
			return null;
		}
	},

	setUserType: (type: "admin" | "resident") => {
		try {
			localStorage.setItem(STORAGE_KEYS.USER_TYPE, type);
		} catch (error) {
			console.error("Failed to store user type:", error);
		}
	},

	getUserType: (): "admin" | "resident" | null => {
		try {
			const type = localStorage.getItem(STORAGE_KEYS.USER_TYPE);
			return type as "admin" | "resident" | null;
		} catch (error) {
			console.error("Failed to retrieve user type:", error);
			return null;
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

	getTokenPayload: (token: string) => {
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
		accessToken: null,
		refreshToken: null,
		user: null,
		isAuthenticated: false,
		isLoading: true,
	});
	const navigate = useNavigate();

	// API mutations
	const loginMutation = useAuthControllerSignIn({
		mutation: {
			onSuccess: (data) => {
				handleLoginSuccess(data);
			},
			onError: () => {
				toast.error("Wrong username or password. Please try again.");
			},
		},
	});

	const logoutMutation = useAuthControllerLogOut({
		mutation: {
			onSuccess: () => {
				handleLogoutSuccess();
			},
			onError: (error) => {
				console.error("Logout failed:", error);
				// Even if logout fails on server, clear local state
				handleLogoutSuccess();
			},
		},
	});

	// Handle login success
	const handleLoginSuccess = useCallback((data: AuthControllerSignIn200) => {
		const accessToken = data?.data?.accessToken;
		const refreshToken = data?.data?.refreshToken;

		if (!accessToken) {
			throw new Error("No access token received");
		}

		// Extract user data from token payload
		const tokenPayload = TokenUtils.getTokenPayload(accessToken);
		const user: User = {
			id: tokenPayload?.sub || tokenPayload?.id || "unknown",
			email: tokenPayload?.email,
			username: tokenPayload?.username,
			role: "admin", // Default to admin since we only have one login type now
			profile: tokenPayload?.profile,
		};

		// Store tokens and user data
		TokenStorage.setAccessToken(accessToken);
		if (refreshToken) {
			TokenStorage.setRefreshToken(refreshToken);
		}
		TokenStorage.setUserData(user);
		TokenStorage.setUserType("admin");

		// Update state
		setAuthState({
			accessToken,
			refreshToken: refreshToken || null,
			user,
			isAuthenticated: true,
			isLoading: false,
		});
	}, []);

	// Handle logout success
	const handleLogoutSuccess = useCallback(() => {
		TokenStorage.clearAll();
		setAuthState({
			accessToken: null,
			refreshToken: null,
			user: null,
			isAuthenticated: false,
			isLoading: false,
		});
	}, []);

	// Login function
	const login = useCallback(
		async (credentials: SignInDto) => {
			try {
				await loginMutation.mutateAsync({ data: credentials });
				navigate(AppPaths.dashboard.todo);
			} catch (error) {
				console.log("Error in login function:", error);
				throw error;
			}
		},
		[loginMutation],
	);

	// Logout function
	const logout = useCallback(async () => {
		try {
			await logoutMutation.mutateAsync();
			window.location.href = AppPaths.auth.login;
		} catch (error) {
			console.error("Logout error:", error);
			// Still clear local state even if server logout fails
			handleLogoutSuccess();
		}
	}, [logoutMutation, handleLogoutSuccess]);

	// Refresh token function (placeholder for future implementation)
	const refreshAccessToken = useCallback(async () => {
		const refreshToken = TokenStorage.getRefreshToken();

		if (!refreshToken) {
			throw new Error("No refresh token available");
		}

		// Check if refresh token is expired
		if (TokenUtils.isTokenExpired(refreshToken)) {
			await logout();
			throw new Error("Refresh token expired");
		}

		try {
			// TODO: Replace with actual refresh token API call when available
			// For now, we'll simulate a refresh token request
			console.log(
				"Refresh token API not yet implemented - using placeholder",
			);

			// This is a placeholder - replace with actual API call
			// const response = await customAxios({
			//   url: '/api/auth/refresh',
			//   method: 'POST',
			//   data: { refreshToken }
			// });

			// For now, just throw an error to logout user
			throw new Error("Refresh token functionality not implemented");
		} catch (error) {
			console.error("Token refresh failed:", error);
			await logout();
			throw error;
		}
	}, [logout]);

	// Clear auth function
	const clearAuth = useCallback(() => {
		handleLogoutSuccess();
	}, [handleLogoutSuccess]);

	// Update user function
	const updateUser = useCallback((userUpdate: Partial<User>) => {
		setAuthState((prev) => {
			if (!prev.user) return prev;

			const updatedUser = { ...prev.user, ...userUpdate };
			TokenStorage.setUserData(updatedUser);

			return {
				...prev,
				user: updatedUser,
			};
		});
	}, []);

	// Initialize auth state from storage
	useEffect(() => {
		const initializeAuth = () => {
			try {
				const accessToken = TokenStorage.getAccessToken();
				const refreshToken = TokenStorage.getRefreshToken();
				const userData = TokenStorage.getUserData();

				if (accessToken && userData) {
					// Check if token is expired
					if (TokenUtils.isTokenExpired(accessToken)) {
						// Try to refresh if we have a refresh token
						if (
							refreshToken &&
							!TokenUtils.isTokenExpired(refreshToken)
						) {
							// TODO: Implement token refresh
							console.log("Token expired, refresh needed");
							handleLogoutSuccess();
						} else {
							// Both tokens expired, clear everything
							handleLogoutSuccess();
						}
					} else {
						// Token is valid, restore auth state
						setAuthState({
							accessToken,
							refreshToken,
							user: userData,
							isAuthenticated: true,
							isLoading: false,
						});
					}
				} else {
					// No valid auth data
					setAuthState((prev) => ({
						...prev,
						isLoading: false,
					}));
				}
			} catch (error) {
				console.error("Failed to initialize auth:", error);
				setAuthState((prev) => ({
					...prev,
					isLoading: false,
				}));
			}
		};

		initializeAuth();
	}, [handleLogoutSuccess]);

	return {
		...authState,
		login,
		logout,
		refreshAccessToken,
		clearAuth,
		updateUser,
	};
};
