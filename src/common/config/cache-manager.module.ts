import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import KeyvRedis, { Keyv } from "@keyv/redis";
import { ConfigModule, ConfigService, ConfigType } from "@nestjs/config";
import { redisConfig } from "../environment/types/redis.type";

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (redis: ConfigType<typeof redisConfig>) => ({
        stores: [
          new KeyvRedis(`redis://${redis.REDIS_HOST}:${redis.REDIS_PORT}`, {
            namespace: redis.REDIS_CACHE_PREFIX || "cache",
          }),
        ],
      }),

      inject: [redisConfig.KEY],
      isGlobal: true,
    }),
  ],
})
export class InitialCacheManagerModule {}
