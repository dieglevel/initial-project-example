import { registerAs } from "@nestjs/config";

type JwtConfigType = {
  JWT_SECRET: string;
  JWT_EXPIRATION_TIME: string;
};

export const jwtConfig = registerAs(
  "jwtConfig",
  (): JwtConfigType => ({
    JWT_SECRET: process.env.JWT_SECRET || "default_secret",
    JWT_EXPIRATION_TIME: process.env.JWT_EXPIRATION_TIME || "3600s",
  }),
);
