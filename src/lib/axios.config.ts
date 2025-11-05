import axios, { AxiosError } from "axios";
import type { AxiosRequestConfig } from "axios";

// Token storage utilities (matching useAuth.ts)
const STORAGE_KEYS = {
	ACCESS_TOKEN: "apartment_admin_access_token",
	REFRESH_TOKEN: "apartment_admin_refresh_token",
} as const;

const getAccessToken = (): string | null => {
	try {
		return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
	} catch (error) {
		console.error("Failed to retrieve access token:", error);
		return null;
	}
};

const clearTokens = () => {
	try {
		localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
		localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
		localStorage.removeItem("apartment_admin_user_data");
		localStorage.removeItem("apartment_admin_user_type");
	} catch (error) {
		console.error("Failed to clear tokens:", error);
	}
};

export const customAxios = <T = unknown>(
	config: AxiosRequestConfig,
): Promise<T> => {
	const instance = axios.create({
		baseURL: import.meta.env.VITE_API_URL || "http://localhost:3030",
	});

	// Request interceptor to add authorization header
	instance.interceptors.request.use(async (config) => {
		const accessToken = getAccessToken();
		if (accessToken) {
			config.headers.Authorization = `Bearer ${accessToken}`;
		}
		return config;
	});

	// Response interceptor to handle token refresh and errors
	instance.interceptors.response.use(
		(response) => {
			return response;
		},
		async (error: AxiosError) => {
			console.error("Axios Interceptor Error:", error);
			console.error(
				"Axios Error:",
				JSON.stringify(error.response?.data, null, 1),
			);

			// Handle 401 Unauthorized
			if (error.response?.status === 401) {
				// Don't interfere with login endpoints
				if (
					error.config?.url?.includes("/api/auth/login") ||
					error.config?.url?.includes("/api/auth/resident-login")
				) {
					return Promise.reject(error);
				}

				console.log(
					"401 Unauthorized - Clearing tokens and redirecting to login",
				);

				// Clear tokens from storage
				clearTokens();

				// Redirect to login page
				if (typeof window !== "undefined") {
					window.location.href = "/auth/login";
				}

				return Promise.reject(error);
			}

			// Handle other errors
			if (error.response?.status && error.response.status >= 500) {
				console.error("Server error:", error.response.status);
			}

			return Promise.reject(error);
		},
	);

	return instance.request<T>(config).then((res) => res.data);
};
