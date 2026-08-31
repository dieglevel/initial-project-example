import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import {
  IJwtTokenStorageService,
  TokenMode,
  TokenType,
} from "./token-storage.interface";

@Injectable()
export class MemoryTokenStorageService implements IJwtTokenStorageService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private getCacheKey(
    userId: number,
    tokenType: TokenType,
    mode: TokenMode,
  ): string {
    return `auth:${userId}:${mode}:${tokenType}`;
  }

  async saveToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    ttlSeconds: number,
    mode: TokenMode,
  ): Promise<void> {
    const key = this.getCacheKey(userId, tokenType, mode);
    // Store key with TTL in milliseconds or seconds depending on cache-manager version
    await this.cacheManager.set(key, token, ttlSeconds * 1000);
  }

  async removeToken(
    userId: number,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<void> {
    const key = this.getCacheKey(userId, tokenType, mode);
    await this.cacheManager.del(key);
  }

  async validateToken(
    userId: number,
    token: string,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<boolean> {
    const key = this.getCacheKey(userId, tokenType, mode);
    const cached = await this.cacheManager.get<string>(key);

    if (mode === "whitelist") {
      return cached === token;
    } else {
      // Blacklist mode: invalid if cached blacklisted token matches presented token
      if (cached === token) {
        return false;
      }
      return true;
    }
  }

  async getToken(
    userId: number,
    tokenType: TokenType,
    mode: TokenMode,
  ): Promise<string | null> {
    const key = this.getCacheKey(userId, tokenType, mode);
    const cached = await this.cacheManager.get<string>(key);
    return cached || null;
  }
}
