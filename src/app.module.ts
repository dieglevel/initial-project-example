import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { LoggerMiddleware } from "./common/middleware/log.middleware";
import { ConfigServiceModule } from "./common/config/config-serivce.module";
import { PostgresModule } from "./common/config/postgres.database.module";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./common/guard/auth.guard";
import { AuthModule } from "./app/auth/auth.module";

@Module({
  imports: [
    ConfigServiceModule,
    PostgresModule,
    // Module Feature
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*path");
  }
}
