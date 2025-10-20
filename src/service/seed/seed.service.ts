import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const isDropDatabase = this.configService.get<boolean>(
      "DATABASE_DROP_SCHEMA",
    );

    if (isDropDatabase) {
    }
  }
}
