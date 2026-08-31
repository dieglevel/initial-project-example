import { Inject, Injectable, Logger } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import KeyvRedis from "@keyv/redis";
import { ConfigType } from "@nestjs/config";
import { redisConfig } from "@/common/environment/types/redis.type";
import {
  IJwtTokenStorageService,
  TokenMode,
  TokenType,
  getTokenHash,
} from "./token-storage.interface";

@Injectable()
export class RedisTokenStorageService implements IJwtTokenStorageService {
  private readonly logger = new Logger(RedisTokenStorageService.name);
  private redisStore: KeyvRedis<any> | null = null;

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Inject(redisConfig.KEY)
    private readonly redisConf: ConfigType<typeof redisConfig>,
  ) {
    this.initRedis();
  }

  private initRedis() {
    if (this.redisConf?.REDIS_HOST && this.redisConf?.REDIS_PORT) {
      try {
        const host = this.redisConf.REDIS_HOST;
        const port = this.redisConf.REDIS_PORT;
        const prefix = this.redisConf.REDIS_CACHE_PREFIX || "jwt";

        this.redisStore = new KeyvRedis(`redis://${host}:${port}`, {
          namespace: prefix,
        });
        this.logger.log(`RedisTokenStorageService initialized (${host}:${port})`);
      } catch (error) {
        this.logger.warn(
          `Failed to initialize Redis store, falling back to MemoryCache: ${error}`,
        );
        this.redisStore = null;
      }
    } else {
      this.logger.log(
        "Redis host/port not configured. Fallback to MemoryCache.",
      );
    }
  }

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
    if (this.redisStore) {
      try {
        await this.redisStore.set(key, token, ttlSeconds * 1000);
        return;
      } catch (err) {
        this.logger.warn(`Redis saveToken error, fallback to CacheManager: ${err}`);
      }
    }
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
    if (this.redisStore) {
      try {
        await this.redisStore.delete(key);
        return;
      } catch (err) {
        this.logger.warn(`Redis removeToken error, fallback to CacheManager: ${err}`);
      }
    }
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
    let cached: string | undefined | null = null;

    if (this.redisStore) {
      try {
        cached = await this.redisStore.get(key);
      } catch (err) {
        this.logger.warn(`Redis validateToken error, fallback to CacheManager: ${err}`);
        cached = await this.cacheManager.get<string>(key);
      }
    } else {
      cached = await this.cacheManager.get<string>(key);
    }

    if (mode === "whitelist") {
      return !!cached && cached === token;
    } else {
      if (cached && cached === token) {
        return false;
      }
      return true;
    }
  }
}
