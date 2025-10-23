import { Global, Module, OnModuleInit } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { appConfig } from "../environment/types/app.config";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { jwtConfig } from "../environment/types/jwt.type";

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      imports: [ConfigModule.forFeature(jwtConfig)],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        global: true,
        secret: config.JWT_SECRET,
        signOptions: {
          expiresIn: config.JWT_EXPIRATION_TIME,
          algorithm: "HS256",
        },
      }),
    }),
  ],
  exports: [JwtModule],
  providers: [],
})
export class InitialJwtModule implements OnModuleInit {
  onModuleInit() {}
}
