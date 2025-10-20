import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  // Node environment
  NODE_ENV: Joi.string().valid("development", "production", "test").required(),

  // App
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default("localhost"),
  API_PREFIX: Joi.string().default("api"),

  // Public folder
  PUBLIC_FOLDER: Joi.string().default("public"),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION_TIME: Joi.string().default("1d"),

  // Database
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),
  DATABASE_DROP_SCHEMA: Joi.boolean()
    .truthy("true", "1")
    .falsy("false", "0")
    .default(false),
  POSTGRES_SYNC: Joi.boolean()
    .truthy("true", "1")
    .falsy("false", "0")
    .default(false),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_CACHE_PREFIX: Joi.string().default("redis-cache"),
  REDIS_BULL_PREFIX: Joi.string().default("redis-bull"),

  // Mail
  SENDINBLUE_API_KEY: Joi.string().required(),

  // Google API
  GOOGLE_API_KEY: Joi.string().optional(),
});
