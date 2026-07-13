import { registerAs } from "@nestjs/config";

type RedisConfigType = {
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_CACHE_PREFIX?: string;
  REDIS_BULL_PREFIX?: string;
};

export const redisConfig = registerAs(
  "redisConfig",
  (): RedisConfigType => ({
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT
      ? parseInt(process.env.REDIS_PORT)
      : undefined,
    REDIS_CACHE_PREFIX: process.env.REDIS_CACHE_PREFIX,
    REDIS_BULL_PREFIX: process.env.REDIS_BULL_PREFIX,
  }),
);
