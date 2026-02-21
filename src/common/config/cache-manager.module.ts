import { CacheModule } from "@nestjs/cache-manager";
import { Module, Logger, OnApplicationBootstrap } from "@nestjs/common";
import KeyvRedis from "@keyv/redis";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { redisConfig } from "../environment/types/redis.type";

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [redisConfig.KEY],
      isGlobal: true,
      useFactory: async (redis: ConfigType<typeof redisConfig>) => {
        // Không log ở đây nữa
        if (!redis?.REDIS_HOST || !redis?.REDIS_PORT) {
          InitialCacheManagerModule.redisStatus = "memory";
          return {};
        }

        try {
          const store = new KeyvRedis(
            `redis://${redis.REDIS_HOST}:${redis.REDIS_PORT}`,
            {
              namespace: redis.REDIS_CACHE_PREFIX || "cache",
            },
          );

          await store.get("__health_check__");

          InitialCacheManagerModule.redisStatus = "redis";

          return {
            stores: [store],
          };
        } catch {
          InitialCacheManagerModule.redisStatus = "fallback";
          return {};
        }
      },
    }),
  ],
})
export class InitialCacheManagerModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialCacheManagerModule.name);

  static redisStatus: "redis" | "memory" | "fallback";

  onApplicationBootstrap() {
    switch (InitialCacheManagerModule.redisStatus) {
      case "redis":
        this.logger.log("Cache strategy: Redis");
        break;

      case "fallback":
        this.logger.log("Cache strategy: Memory (Redis connection failed)");
        break;

      default:
        this.logger.log("Cache strategy: Memory (Redis config not provided)");
    }
  }
}
