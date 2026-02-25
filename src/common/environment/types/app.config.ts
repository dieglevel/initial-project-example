import { registerAs } from "@nestjs/config";

type AppConfigType = {
  NODE_ENV: "development" | "production" | "test";

  PORT: number;
  HOST: string;
  API_PREFIX: string;

  ROUTE_FOLDER: string;
  ROOT_UPLOAD_FOLDER: string;

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

    ROUTE_FOLDER: process.env.ROUTE_FOLDER ?? "file",
    ROOT_UPLOAD_FOLDER: process.env.ROOT_UPLOAD_FOLDER ?? "./",

    MAIL: {
      SENDINBLUE_KEY: process.env.SENDINBLUE_API_KEY!,
    },

    GOOGLE: {
      API_KEY: process.env.GOOGLE_API_KEY,
    },
  }),
);
