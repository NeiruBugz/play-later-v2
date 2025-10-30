import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  runtimeEnv: {
    AUTH_COGNITO_ID: process.env.AUTH_COGNITO_ID,
    AUTH_COGNITO_SECRET: process.env.AUTH_COGNITO_SECRET,
    AUTH_COGNITO_ISSUER: process.env.AUTH_COGNITO_ISSUER,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    IGDB_CLIENT_ID: process.env.IGDB_CLIENT_ID,
    IGDB_CLIENT_SECRET: process.env.IGDB_CLIENT_SECRET,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NODE_ENV: process.env.NODE_ENV ?? "development",
    AUTH_ENABLE_CREDENTIALS: process.env.AUTH_ENABLE_CREDENTIALS,
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
  },
  server: {
    AUTH_COGNITO_ID: z.string({ message: "AUTH_COGNITO_ID is required" }),
    AUTH_COGNITO_SECRET: z.string({ message: "AUTH_COGNITO_SECRET is required" }),
    AUTH_COGNITO_ISSUER: z.string({ message: "AUTH_COGNITO_ISSUER is required" }),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    AUTH_SECRET: z.string({ message: "AUTH_SECRET is required" }),
    AUTH_URL: z.string().url({ message: "AUTH_URL is required" }),
    IGDB_CLIENT_ID: z.string({ message: "IGDB_CLIENT_ID is required" }),
    IGDB_CLIENT_SECRET: z.string({ message: "IGDB_CLIENT_SECRET is required" }),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .optional(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    AUTH_ENABLE_CREDENTIALS: z
      .enum(["true", "false"]) // enable test/dev-only Credentials provider
      .optional(),
    POSTGRES_DATABASE: z.string({ message: "POSTGRES_DATABASE is required" }),
    POSTGRES_HOST: z.string({ message: "POSTGRES_HOST is required" }),
    POSTGRES_PASSWORD: z.string({ message: "POSTGRES_PASSWORD is required" }),
    POSTGRES_PRISMA_URL: z
      .string()
      .url({ message: "POSTGRES_PRISMA_URL is required" }),
    POSTGRES_URL: z.string().url({ message: "POSTGRES_URL is required" }),
    POSTGRES_URL_NO_SSL: z
      .string()
      .url({ message: "POSTGRES_URL_NO_SSL is required" }),
    POSTGRES_URL_NON_POOLING: z
      .string()
      .url({ message: "POSTGRES_URL_NON_POOLING is required" }),
    POSTGRES_USER: z.string({ message: "POSTGRES_USER is required" }),
    STEAM_API_KEY: z.string({ message: "STEAM_API_KEY is required" }),

    // S3 Storage Configuration
    AWS_REGION: z.string().min(1, { message: "AWS_REGION is required" }),
    AWS_ENDPOINT_URL: z.string().optional(), // LocalStack in dev
    AWS_ACCESS_KEY_ID: z.string().min(1, { message: "AWS_ACCESS_KEY_ID is required" }),
    AWS_SECRET_ACCESS_KEY: z.string().min(1, { message: "AWS_SECRET_ACCESS_KEY is required" }),
    S3_BUCKET_NAME: z.string().min(1, { message: "S3_BUCKET_NAME is required" }),
    S3_AVATAR_PATH_PREFIX: z
      .string()
      .min(1, { message: "S3_AVATAR_PATH_PREFIX is required" })
      .refine((val) => val.endsWith("/"), {
        message: "S3_AVATAR_PATH_PREFIX must end with '/'",
      }),
  },
});
