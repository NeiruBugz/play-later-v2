import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  runtimeEnv: {
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    IGDB_CLIENT_ID: process.env.IGDB_CLIENT_ID,
    IGDB_CLIENT_SECRET: process.env.IGDB_CLIENT_SECRET,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NODE_ENV: process.env.NODE_ENV ?? "development",
    POSTGRES_DATABASE: process.env.POSTGRES_DATABASE,
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    POSTGRES_URL_NO_SSL: process.env.POSTGRES_URL_NO_SSL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
    POSTGRES_USER: process.env.POSTGRES_USER,
    STEAM_API_KEY: process.env.STEAM_API_KEY,
  },
  server: {
    AUTH_GOOGLE_ID: z.string({ message: "AUTH_GOOGLE_ID is required" }),
    AUTH_GOOGLE_SECRET: z.string({ message: "AUTH_GOOGLE_SECRET is required" }),
    AUTH_SECRET: z.string({ message: "AUTH_SECRET is required" }),
    AUTH_URL: z.string().url({ message: "AUTH_URL is required" }),
    IGDB_CLIENT_ID: z.string({ message: "IGDB_CLIENT_ID is required" }),
    IGDB_CLIENT_SECRET: z.string({ message: "IGDB_CLIENT_SECRET is required" }),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .optional(),
    NODE_ENV: z.enum(["development", "test", "production"]),
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
  },
});
