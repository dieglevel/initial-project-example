import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { jwtConfig } from "@/common/environment/types/jwt.type";
import { redisConfig } from "@/common/environment/types/redis.type";
import { AccountEntity } from "../account/_entities/account.entity";
import { AccountModule } from "../account/account.module";
import { ProfileEntity } from "../profile/_entities/profile.entity";
import { AuthTokenEntity } from "./_entities/auth-token.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { TOKEN_STORAGE_SERVICE } from "./storage/token-storage.interface";
import { DatabaseTokenStorageService } from "./storage/database-token-storage.service";
import { RedisTokenStorageService } from "./storage/redis-token-storage.service";
import { MemoryTokenStorageService } from "./storage/memory-token-storage.service";

@Module({
  imports: [
    AccountModule,
    ConfigModule.forFeature(redisConfig),
    TypeOrmModule.forFeature([AccountEntity, ProfileEntity, AuthTokenEntity]),
  ],
  controllers: [AuthController],
  providers: [
    DatabaseTokenStorageService,
    RedisTokenStorageService,
    MemoryTokenStorageService,
    {
      provide: TOKEN_STORAGE_SERVICE,
      useFactory: (
        config: ConfigType<typeof jwtConfig>,
        dbStorage: DatabaseTokenStorageService,
        redisStorage: RedisTokenStorageService,
        memoryStorage: MemoryTokenStorageService,
      ) => {
        const driver = config.AUTH_TOKEN_STORE_DRIVER || "memoryCache";
        if (driver === "database") {
          return dbStorage;
        }
        if (driver === "redis") {
          return redisStorage;
        }
        return memoryStorage;
      },
      inject: [
        jwtConfig.KEY,
        DatabaseTokenStorageService,
        RedisTokenStorageService,
        MemoryTokenStorageService,
      ],
    },
    AuthService,
  ],
  exports: [AuthService, TOKEN_STORAGE_SERVICE],
})
export class AuthModule {}
