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
import { AccountModule } from "./module/account-module/account.module";

@Module({
  imports: [InitialConfigServiceModule, InitialPostgresModule, AccountModule],
  controllers: [],
  providers: [InformationServerLogService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*path");
  }
}
