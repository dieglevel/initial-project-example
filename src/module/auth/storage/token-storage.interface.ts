export const TOKEN_STORAGE_SERVICE = "TOKEN_STORAGE_SERVICE";

export type TokenType = "accessToken" | "refreshToken";
export type TokenMode = "whitelist" | "blacklist";

export interface IJwtTokenStorageService {
  /**
   * Save a token or blacklist entry for a user
   */
  saveToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    ttlSeconds: number,
    mode: TokenMode,
  ): Promise<void>;

  /**
   * Remove a token (e.g. on logout in whitelist mode or token invalidation)
   */
  removeToken(
    userId: number,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<void>;

  /**
   * Validate token against the selected mode:
   * - Whitelist mode: returns true if token exists and matches active user token.
   * - Blacklist mode: returns true if token is NOT in the revoked list.
   */
  validateToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<boolean>;

  /**
   * Retrieve active stored token string
   */
  getToken(
    userId: number,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<string | null>;
}
