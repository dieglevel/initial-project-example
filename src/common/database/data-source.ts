import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { join } from "path";
import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
dotenv.config({
  path: join(process.cwd(), ".env.prod"),
});

export default new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl: {
    rejectUnauthorized: false,
  },

  entities: ["src/**/*.entity.ts"],
  migrations: ["src/common/database/migrations/*.ts"],
});
