import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ServeStaticModule as ServeStaticModuleNest } from "@nestjs/serve-static";
import { join } from "path";

@Module({
  imports: [
    ServeStaticModuleNest.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const publicFolder = configService.get<string>("PUBLIC_FOLDER");
        if (!publicFolder) {
          throw new Error("PUBLIC_FOLDER is not defined in .env");
        }
        return [
          {
            rootPath: join(__dirname, "..", "..", "..", publicFolder),
            serveRoot: `/${publicFolder}`,
          },
        ];
      },
    }),
  ],
})
export class InitialServeStaticModule implements OnModuleInit {
  onModuleInit() {}
}
