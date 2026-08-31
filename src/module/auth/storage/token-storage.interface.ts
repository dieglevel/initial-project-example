import * as crypto from "crypto";

export const TOKEN_STORAGE_SERVICE = "TOKEN_STORAGE_SERVICE";

export type TokenType = "accessToken" | "refreshToken";
export type TokenMode = "whitelist" | "blacklist";

export const getTokenHash = (token: string): string => {
  if (!token) return "empty";
  return crypto.createHash("md5").update(token).digest("hex");
};

export interface IJwtTokenStorageService {
  /**
   * Save a specific token or blacklist entry for a user session
   */
  saveToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    ttlSeconds: number,
    mode: TokenMode,
  ): Promise<void>;

  /**
   * Remove a specific token (e.g. on logout for current device)
   */
  removeToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<void>;

  /**
   * Remove all active tokens for a user across all devices
   */
  removeAllUserTokens?(userId: number): Promise<void>;

  /**
   * Validate token against the selected mode for multi-device support:
   * - Whitelist mode: returns true if specific token exists in storage.
   * - Blacklist mode: returns true if specific token is NOT in revoked list.
   */
  validateToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<boolean>;
}
