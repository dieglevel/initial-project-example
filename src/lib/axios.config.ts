// ✅ src/api/customAxios.ts
import axios from "axios";
import type { AxiosRequestConfig } from "axios";

// Đây là hàm mutator đúng chuẩn
export const customAxios = <T = unknown>(
	config: AxiosRequestConfig,
): Promise<T> => {
	const instance = axios.create({
		baseURL: import.meta.env.VITE_API_URL || "http://localhost:3030",
	});

	return instance.request<T>(config).then((res) => res.data);
};
