export const AuthTokenCacheMode = {
  Whitelist: "whitelist",
  Blacklist: "blacklist",
} as const;

export type AuthTokenCacheMode =
  (typeof AuthTokenCacheMode)[keyof typeof AuthTokenCacheMode];

export const authTokenCacheKey = (
  userId: string,
  mode: AuthTokenCacheMode,
  tokenType: "accessToken" | "refreshToken",
) => `auth:${userId}:${mode}:${tokenType}`;

export const authAccessTokenCacheKey = (userId: string) =>
  authTokenCacheKey(userId, AuthTokenCacheMode.Whitelist, "accessToken");

export const authAccessTokenBlacklistCacheKey = (userId: string) =>
  authTokenCacheKey(userId, AuthTokenCacheMode.Blacklist, "accessToken");

export const authRefreshTokenCacheKey = (userId: string) =>
  authTokenCacheKey(userId, AuthTokenCacheMode.Whitelist, "refreshToken");

export const authRefreshTokenBlacklistCacheKey = (userId: string) =>
  authTokenCacheKey(userId, AuthTokenCacheMode.Blacklist, "refreshToken");

export const authAccessTokenCacheExpiresIn = 1 * 60 * 60 * 1000; // 1 hour
export const authRefreshTokenCacheExpiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days
