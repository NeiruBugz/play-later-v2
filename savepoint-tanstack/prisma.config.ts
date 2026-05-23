import { defineConfig } from "prisma/config";

// Prisma 7's `prisma.config.ts` disables automatic `.env` loading. Load it
// ourselves so `prisma generate` (run as part of `build`) finds the DB URL
// from `.env` locally. In CI / Vercel there is no `.env` file — the URL comes
// from the injected `process.env`, so the missing-file case is ignored.
try {
  process.loadEnvFile();
} catch {
  // No `.env` present (CI / Vercel) — rely on the ambient process.env.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: (() => {
      const url =
        process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_PRISMA_URL;
      if (!url) {
        throw new Error(
          "Database URL not configured. Set POSTGRES_URL_NON_POOLING or POSTGRES_PRISMA_URL"
        );
      }
      return url;
    })(),
  },
});
