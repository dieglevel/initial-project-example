// ✅ src/api/customAxios.ts
import axios, { AxiosRequestConfig } from "axios";

// Đây là hàm mutator đúng chuẩn
export const customAxios = <T = unknown>(
  config: AxiosRequestConfig
): Promise<T> => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030"
  });

  return instance.request<T>(config).then((res) => res.data);
};
