import {
  MiddlewareConsumer,
  Module,
  NestModule,
  OnApplicationBootstrap,
} from "@nestjs/common";
import { LoggerMiddleware } from "./common/middleware/log.middleware";

import { InitialConfigServiceModule } from "./common/environment/config-service.module";
import { InformationServerLogService } from "./service/information-server/information-server.service";
import { InitialPostgresModule } from "./common/config/postgres.database.module";
import { AuthModule } from "./module/auth/auth.module";
import { InitialJwtModule } from "./common/config/jwt.module";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./module/auth/jwt.guard";
import { AccountModule } from "./module/account/account.module";
import { ProfileModule } from "./module/profile/profile.module";
import { InitialCacheManagerModule } from "./common/config/cache-manager.module";
import { FileModule } from "./module/file/file.module";
import { TodoModule } from "./module/todo/todo.module";
import { PaymentModule } from "./module/payment/payment.module";

@Module({
  imports: [
    InitialConfigServiceModule,
    InitialPostgresModule,
    InitialJwtModule,
    InitialCacheManagerModule,

    AuthModule,
    AccountModule,
    ProfileModule,
    FileModule,
    TodoModule,
    PaymentModule,
  ],
  controllers: [],
  providers: [
    InformationServerLogService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*path");
  }
}
