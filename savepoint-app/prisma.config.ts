import { defineConfig } from "prisma/config";

import "dotenv/config";

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
