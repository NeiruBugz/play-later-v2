import { env } from "@/env.mjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { createLogger } from "./logger";
import { LOGGER_CONTEXT } from "./logger-context";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const prismaFactory = () => {
  const pool =
    globalForPrisma.pool ??
    new Pool({ connectionString: env.POSTGRES_PRISMA_URL });

  if (!globalForPrisma.pool) {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({
    adapter,
    log: [
      {
        emit: "event",
        level: "query",
      },
      {
        emit: "stdout",
        level: "error",
      },
      {
        emit: "stdout",
        level: "info",
      },
      {
        emit: "stdout",
        level: "warn",
      },
    ],
  });

  const isDatabaseLoggingEnabled =
    env.NODE_ENV === "development" && env.DATABASE_LOGGING === "true";
  if (isDatabaseLoggingEnabled) {
    const logger = createLogger({ [LOGGER_CONTEXT.DATABASE]: "Prisma" });
    prisma.$on("query", (e) => {
      logger.debug(
        {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
          target: e.target,
        },
        "Database query executed"
      );
    });
  }
  return prisma as PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? prismaFactory();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function cleanup() {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
  if (globalForPrisma.pool) {
    await globalForPrisma.pool.end();
    globalForPrisma.pool = undefined;
  }
}
