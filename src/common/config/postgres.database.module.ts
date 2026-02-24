import { Module, OnApplicationBootstrap, OnModuleInit } from "@nestjs/common";
import { ConfigService, ConfigType } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { databaseConfig } from "../environment/types/database.type";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (database: ConfigType<typeof databaseConfig>) => {
        return {
          type: "postgres",
          ssl: {
            rejectUnauthorized: false,
          },
          host: database.POSTGRES_HOST,
          port: database.POSTGRES_PORT,
          username: database.POSTGRES_USER,
          password: database.POSTGRES_PASSWORD,
          database: database.POSTGRES_DB,
          autoLoadEntities: true,
          // * Check later
          entities: ["dist/**/*.entity.js"],
          synchronize: database.POSTGRES_SYNC,
          // dropSchema: true,

          dropSchema: database.DATABASE_DROP_SCHEMA,
          // migrations: ["src/migrations/*.ts"],
          // logging: true,
          // logger: "advanced-console",
        };
      },
    }),
  ],
  exports: [],
  providers: [],
})
export class InitialPostgresModule implements OnModuleInit {
  onModuleInit() {}
}
