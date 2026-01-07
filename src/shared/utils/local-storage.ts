import type { JwtPayload } from "../auth/auth.context";

const _prefix = import.meta.env.VITE_API_URL || "app_";

export interface LocalStorageSchema {
  accessToken: string;
  refreshToken: string;
  user: JwtPayload;
  theme: "light" | "dark";
}

export const LocalStorageUtil = {
  set<TKey extends keyof LocalStorageSchema>(
    key: TKey,
    value: LocalStorageSchema[TKey],
  ) {
    localStorage.setItem(_prefix + key, JSON.stringify(value));
  },

  get<TKey extends keyof LocalStorageSchema>(
    key: TKey,
  ): LocalStorageSchema[TKey] | null {
    const item = localStorage.getItem(_prefix + key);
    return item ? (JSON.parse(item) as LocalStorageSchema[TKey]) : null;
  },

  remove<TKey extends keyof LocalStorageSchema>(key: TKey) {
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
