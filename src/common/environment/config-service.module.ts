import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule, registerAs } from "@nestjs/config";
import { envValidationSchema } from "./valid-schema";
import { appConfig } from "./types/app.config";
import { databaseConfig } from "./types/database.type";
import { jwtConfig } from "./types/jwt.type";
import { redisConfig } from "./types/redis.type";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, ".env"],
      validationSchema: envValidationSchema,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
    }),
  ],
  controllers: [],
  providers: [],
})
export class InitialConfigServiceModule implements OnModuleInit {
  onModuleInit() {}
}
