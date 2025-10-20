import { registerAs } from "@nestjs/config";

type DatabaseConfigType = {
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_SYNC: boolean;
  POSTGRES_DB: string;
  DATABASE_DROP_SCHEMA: boolean;
};

export const databaseConfig = registerAs(
  "database",
  (): DatabaseConfigType => ({
    POSTGRES_HOST: process.env.POSTGRES_HOST ?? "localhost",
    POSTGRES_PORT: process.env.POSTGRES_PORT
      ? Number(process.env.POSTGRES_PORT)
      : 5432,
    POSTGRES_USER: process.env.POSTGRES_USER ?? "user",
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ?? "password",
    POSTGRES_SYNC: process.env.POSTGRES_SYNC === "true",
    POSTGRES_DB: process.env.POSTGRES_DB ?? "database",
    DATABASE_DROP_SCHEMA: process.env.DATABASE_DROP_SCHEMA === "true",
  }),
);
