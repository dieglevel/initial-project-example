import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService, ConfigType } from "@nestjs/config";
import { databaseConfig } from "src/common/environment/types/database.type";
import { DataSource } from "typeorm";

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private dataSource: DataSource,
    @Inject(databaseConfig.KEY)
    private database: ConfigType<typeof databaseConfig>,
  ) {}

  async onModuleInit() {
    const isDropDatabase = this.database.DATABASE_DROP_SCHEMA;

    if (isDropDatabase) {
      // Seeder
    }
  }
}
