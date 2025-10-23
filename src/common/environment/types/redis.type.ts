import { registerAs } from "@nestjs/config";

type RedisConfigType = {
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_CACHE_PREFIX: string;
  REDIS_BULL_PREFIX: string;
};

export const redisConfig = registerAs(
  "redisConfig",
  (): RedisConfigType => ({
    REDIS_HOST: process.env.REDIS_HOST || "localhost",
    REDIS_PORT: parseInt(process.env.REDIS_PORT ?? "6379", 10),
    REDIS_CACHE_PREFIX: process.env.REDIS_CACHE_PREFIX || "cache",
    REDIS_BULL_PREFIX: process.env.REDIS_BULL_PREFIX || "bull",
  }),
);
