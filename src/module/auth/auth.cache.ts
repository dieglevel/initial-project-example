export const AuthTokenCacheMode = {
  Whitelist: "whitelist",
  Blacklist: "blacklist",
} as const;

export type AuthTokenCacheMode =
  (typeof AuthTokenCacheMode)[keyof typeof AuthTokenCacheMode];

export const authTokenCacheKey = (
  userId: number,
  mode: AuthTokenCacheMode,
  tokenType: "accessToken" | "refreshToken",
) => `auth:${userId}:${mode}:${tokenType}`;

export const authAccessTokenCacheKey = (userId: number) =>
  authTokenCacheKey(userId, AuthTokenCacheMode.Whitelist, "accessToken");

export const authAccessTokenBlacklistCacheKey = (userId: number) =>
  authTokenCacheKey(userId, AuthTokenCacheMode.Blacklist, "accessToken");

export const authRefreshTokenCacheKey = (userId: number) =>
  authTokenCacheKey(userId, AuthTokenCacheMode.Whitelist, "refreshToken");

export const authRefreshTokenBlacklistCacheKey = (userId: number) =>
  authTokenCacheKey(userId, AuthTokenCacheMode.Blacklist, "refreshToken");

export const authAccessTokenCacheExpiresIn = 1 * 60 * 60; // 1 hour
export const authRefreshTokenCacheExpiresIn = 60 * 60 * 24 * 7; // 7 days
