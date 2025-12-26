import type { JwtPayload } from "../auth/auth.context";

const _prefix = import.meta.env.VITE_API_URL || "app_";

export interface LocalStorageSchema {
  accessToken: string;
  refreshToken: string;
  user: JwtPayload;
  theme: "light" | "dark";
}

export const LocalStorageUtil = {
  set<K extends keyof LocalStorageSchema>(
    key: K,
    value: LocalStorageSchema[K],
  ) {
    localStorage.setItem(_prefix + key, JSON.stringify(value));
  },

  get<K extends keyof LocalStorageSchema>(
    key: K,
  ): LocalStorageSchema[K] | null {
    const item = localStorage.getItem(_prefix + key);
    return item ? (JSON.parse(item) as LocalStorageSchema[K]) : null;
  },

  remove<K extends keyof LocalStorageSchema>(key: K) {
    localStorage.removeItem(_prefix + key);
  },

  clear() {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(_prefix)) {
        localStorage.removeItem(key);
      }
    });
  },
};
