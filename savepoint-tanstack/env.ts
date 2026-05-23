/**
 * Env validation for savepoint-tanstack — the owner of the env schema.
 *
 * Notes on the two non-obvious choices:
 *   1. Uses @t3-oss/env-core (framework-agnostic) instead of @t3-oss/env-nextjs,
 *      because TanStack Start runs on Vite — there is no Next.js runtime.
 *   2. Configures clientPrefix: "VITE_" so any future client-exposed variable is
 *      named VITE_FOO (Vite only inlines variables matching its prefix into the
 *      browser bundle). The schema currently has zero client keys, so this is
 *      forward-compat only — no renames required today.
 *
 * All app code MUST import `env` from this file. Never read `process.env.*`
 * directly outside this module.
 */
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  server: {
    AUTH_COGNITO_ID: z.string({ message: "AUTH_COGNITO_ID is required" }),
    AUTH_COGNITO_SECRET: z.string({
      message: "AUTH_COGNITO_SECRET is required",
    }),
    AUTH_COGNITO_ISSUER: z.string({
      message: "AUTH_COGNITO_ISSUER is required",
    }),
    AUTH_COGNITO_DOMAIN: z.string().optional(),
    BETTER_AUTH_SECRET: z.string({ message: "BETTER_AUTH_SECRET is required" }),
    BETTER_AUTH_URL: z.url({ message: "BETTER_AUTH_URL is required" }),
    AUTH_MIGRATION_CUTOVER_AT: z.iso
      .datetime({
        offset: true,
        message: "AUTH_MIGRATION_CUTOVER_AT must be ISO-8601 UTC",
      })
      .optional()
      .or(z.literal("")),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    IGDB_CLIENT_ID: z.string({ message: "IGDB_CLIENT_ID is required" }),
    IGDB_CLIENT_SECRET: z.string({ message: "IGDB_CLIENT_SECRET is required" }),
    AUTH_ENABLE_CREDENTIALS: z.enum(["true", "false"]).optional(),
    DATABASE_LOGGING: z.enum(["true", "false"]).optional(),
    POSTGRES_DATABASE: z.string({ message: "POSTGRES_DATABASE is required" }),
    POSTGRES_HOST: z.string({ message: "POSTGRES_HOST is required" }),
    POSTGRES_PASSWORD: z.string({ message: "POSTGRES_PASSWORD is required" }),
    POSTGRES_PRISMA_URL: z.url({ message: "POSTGRES_PRISMA_URL is required" }),
    POSTGRES_URL: z.url({ message: "POSTGRES_URL is required" }),
    POSTGRES_URL_NO_SSL: z.url({ message: "POSTGRES_URL_NO_SSL is required" }),
    POSTGRES_URL_NON_POOLING: z.url({
      message: "POSTGRES_URL_NON_POOLING is required",
    }),
    POSTGRES_USER: z.string({ message: "POSTGRES_USER is required" }),
    STEAM_API_KEY: z.string({ message: "STEAM_API_KEY is required" }),
    AWS_REGION: z.string().min(1, { message: "AWS_REGION is required" }),
    AWS_ENDPOINT_URL: z.string().optional(),
    AWS_ACCESS_KEY_ID: z
      .string()
      .min(1, { message: "AWS_ACCESS_KEY_ID is required" }),
    AWS_SECRET_ACCESS_KEY: z
      .string()
      .min(1, { message: "AWS_SECRET_ACCESS_KEY is required" }),
    S3_BUCKET_NAME: z
      .string()
      .min(1, { message: "S3_BUCKET_NAME is required" }),
    S3_AVATAR_PATH_PREFIX: z
      .string()
      .min(1, { message: "S3_AVATAR_PATH_PREFIX is required" })
      .refine((val) => val.endsWith("/"), {
        message: "S3_AVATAR_PATH_PREFIX must end with '/'",
      }),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  },
  client: {},
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .optional(),
  },
  runtimeEnv: {
    AUTH_COGNITO_ID: process.env.AUTH_COGNITO_ID,
    AUTH_COGNITO_SECRET: process.env.AUTH_COGNITO_SECRET,
    AUTH_COGNITO_ISSUER: process.env.AUTH_COGNITO_ISSUER,
    AUTH_COGNITO_DOMAIN: process.env.AUTH_COGNITO_DOMAIN,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    AUTH_MIGRATION_CUTOVER_AT: process.env.AUTH_MIGRATION_CUTOVER_AT,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    IGDB_CLIENT_ID: process.env.IGDB_CLIENT_ID,
    IGDB_CLIENT_SECRET: process.env.IGDB_CLIENT_SECRET,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NODE_ENV: process.env.NODE_ENV ?? "development",
    AUTH_ENABLE_CREDENTIALS: process.env.AUTH_ENABLE_CREDENTIALS,
    DATABASE_LOGGING: process.env.DATABASE_LOGGING,
    POSTGRES_DATABASE: process.env.POSTGRES_DATABASE,
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    POSTGRES_URL_NO_SSL: process.env.POSTGRES_URL_NO_SSL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
    POSTGRES_USER: process.env.POSTGRES_USER,
    STEAM_API_KEY: process.env.STEAM_API_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    S3_AVATAR_PATH_PREFIX: process.env.S3_AVATAR_PATH_PREFIX,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
