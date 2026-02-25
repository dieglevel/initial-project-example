import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule, ConfigService, ConfigType } from "@nestjs/config";
import { ServeStaticModule as ServeStaticModuleNest } from "@nestjs/serve-static";
import { join } from "path";
import { appConfig } from "../environment/types/app.config";

@Module({
  imports: [
    ServeStaticModuleNest.forRootAsync({
      imports: [ConfigModule],
      inject: [appConfig.KEY],
      useFactory: (configService: ConfigType<typeof appConfig>) => {
        const routeFolder = configService.ROUTE_FOLDER;
        const folderUpload = configService.ROOT_UPLOAD_FOLDER;
        const path = join(folderUpload, routeFolder);
        return [
          {
            rootPath: path,
            serveRoot: `/${routeFolder}`,
          },
        ];
      },
    }),
  ],
})
export class InitialServeStaticModule implements OnModuleInit {
  onModuleInit() {}
}
