export const authAccessTokenCacheKey = (userId: string) =>
  `auth:${userId}:accessToken`;

export const authRefreshTokenCacheKey = (userId: string) =>
  `auth:${userId}:refreshToken`;

export const authAccessTokenCacheExpiresIn = 1 * 60 * 60 * 1000; // 1 hour
export const authRefreshTokenCacheExpiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days
