/**
 * Env schema shared by the web app and the Lambdas: only variables the worker
 * graph reads. `env.ts` extends it; `env.lambda.ts` re-exports it as `@env`
 * for `tsconfig.lambdas.json`, so a web-only variable read in the worker graph
 * fails `typecheck:lambdas`.
 */
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const coreEnv = createEnv({
  clientPrefix: "VITE_",
  server: {
    POSTGRES_PRISMA_URL: z.url({ message: "POSTGRES_PRISMA_URL is required" }),
    IGDB_CLIENT_ID: z.string({ message: "IGDB_CLIENT_ID is required" }),
    IGDB_CLIENT_SECRET: z.string({ message: "IGDB_CLIENT_SECRET is required" }),
    STEAM_API_KEY: z.string({ message: "STEAM_API_KEY is required" }),
    STEAM_SYNC_ENRICH_QUEUE_URL: z.url().optional(),
    DB_POOL_MAX: z.coerce.number().int().min(1).optional(),
    IGDB_MIN_INTERVAL_MS: z.coerce.number().int().min(0).optional(),
    SYNC_MAX_RECEIVE_COUNT: z.coerce.number().int().min(1).default(3),
  },
  client: {},
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .optional(),
  },
  runtimeEnv: {
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
    IGDB_CLIENT_ID: process.env.IGDB_CLIENT_ID,
    IGDB_CLIENT_SECRET: process.env.IGDB_CLIENT_SECRET,
    STEAM_API_KEY: process.env.STEAM_API_KEY,
    STEAM_SYNC_ENRICH_QUEUE_URL: process.env.STEAM_SYNC_ENRICH_QUEUE_URL,
    DB_POOL_MAX: process.env.DB_POOL_MAX,
    IGDB_MIN_INTERVAL_MS: process.env.IGDB_MIN_INTERVAL_MS,
    SYNC_MAX_RECEIVE_COUNT: process.env.SYNC_MAX_RECEIVE_COUNT,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NODE_ENV: process.env.NODE_ENV ?? "development",
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
