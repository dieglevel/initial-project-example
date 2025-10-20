import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import KeyvRedis, { Keyv } from "@keyv/redis";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configModule: ConfigService) => ({
        stores: [
          new KeyvRedis(
            `redis://${configModule.get("REDIS_HOST")}:${configModule.get("REDIS_PORT")}`,
            {
              namespace: configModule.get("REDIS_CACHE_PREFIX") || "cache",
            },
          ),
        ],
      }),

      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
})
export class InitialCacheManagerModule {}
 