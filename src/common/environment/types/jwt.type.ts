import { registerAs } from "@nestjs/config";

type JwtConfigType = {
  JWT_SECRET: string;
  JWT_EXPIRATION_TIME: string;
  AUTH_ACCESS_TOKEN_CACHE_MODE: "whitelist" | "blacklist";
  AUTH_TOKEN_STORE_DRIVER: "database" | "redis" | "memoryCache";
};

export const jwtConfig = registerAs(
  "jwtConfig",
  (): JwtConfigType => ({
    JWT_SECRET: process.env.JWT_SECRET || "default_secret",
    JWT_EXPIRATION_TIME: process.env.JWT_EXPIRATION_TIME || "3600s",
    AUTH_ACCESS_TOKEN_CACHE_MODE:
      (process.env.AUTH_ACCESS_TOKEN_CACHE_MODE as "whitelist" | "blacklist") ||
      "whitelist",
    AUTH_TOKEN_STORE_DRIVER:
      (process.env.AUTH_TOKEN_STORE_DRIVER as
        | "database"
        | "redis"
        | "memoryCache") || "memoryCache",
  }),
);
