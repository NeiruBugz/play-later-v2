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
    AUTH_GOOGLE_ID: z.string(),
    AUTH_GOOGLE_SECRET: z.string(),
    AUTH_SECRET: z.string(),
    AUTH_URL: z.string().url().optional(),
    IGDB_CLIENT_ID: z.string(),
    IGDB_CLIENT_SECRET: z.string(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    POSTGRES_DATABASE: z.string(),
    POSTGRES_HOST: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_PRISMA_URL: z.string().url(),
    POSTGRES_URL: z.string().url(),
    POSTGRES_URL_NO_SSL: z.string().url(),
    POSTGRES_URL_NON_POOLING: z.string().url(),
    POSTGRES_USER: z.string(),
    STEAM_API_KEY: z.string(),
  },
});
