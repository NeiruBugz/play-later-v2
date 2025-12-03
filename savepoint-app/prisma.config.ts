import { defineConfig } from "prisma/config";

import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url:
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.POSTGRES_PRISMA_URL ??
      "",
  },
});
