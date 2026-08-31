import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import {
  IJwtTokenStorageService,
  TokenMode,
  TokenType,
  getTokenHash,
} from "./token-storage.interface";

@Injectable()
export class MemoryTokenStorageService implements IJwtTokenStorageService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private getCacheKey(
    userId: number,
    token: string,
    tokenType: TokenType,
    mode: TokenMode,
  ): string {
    const hash = getTokenHash(token);
    return `auth:${userId}:${mode}:${tokenType}:${hash}`;
  }

  async saveToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    ttlSeconds: number,
    mode: TokenMode,
  ): Promise<void> {
    if (!token) return;
    const key = this.getCacheKey(userId, token, tokenType, mode);
    await this.cacheManager.set(key, token, ttlSeconds * 1000);
  }

  async removeToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<void> {
    if (!token) return;
    const key = this.getCacheKey(userId, token, tokenType, mode);
    await this.cacheManager.del(key);
  }

  async validateToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<boolean> {
    if (!token) return false;
    const key = this.getCacheKey(userId, token, tokenType, mode);
    const cached = await this.cacheManager.get<string>(key);

    if (mode === "whitelist") {
      return !!cached && cached === token;
    } else {
      // Blacklist mode: invalid if specific token is in cache
      if (cached && cached === token) {
        return false;
      }
      return true;
    }
  }
}
