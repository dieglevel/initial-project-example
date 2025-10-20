import { registerAs } from "@nestjs/config";

type AppConfigType = {
  NODE_ENV: "development" | "production" | "test";

  PORT: number;
  HOST: string;
  API_PREFIX: string;

  PUBLIC_FOLDER: string;

  MAIL: {
    SENDINBLUE_KEY: string;
  };

  GOOGLE: {
    API_KEY?: string;
  };
};

export const appConfig = registerAs(
  "appConfig",
  (): AppConfigType => ({
    NODE_ENV: process.env.NODE_ENV as "development" | "production" | "test",
    PORT: parseInt(process.env.PORT ?? "3000", 10),
    HOST: process.env.HOST ?? "localhost",
    API_PREFIX: process.env.API_PREFIX ?? "api",

    PUBLIC_FOLDER: process.env.PUBLIC_FOLDER ?? "public",

    MAIL: {
      SENDINBLUE_KEY: process.env.SENDINBLUE_API_KEY!,
    },

    GOOGLE: {
      API_KEY: process.env.GOOGLE_API_KEY,
    },
  }),
);
