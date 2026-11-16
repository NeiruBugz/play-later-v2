import { env } from "@env";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { createLogger } from "@/shared/lib/logger";

import { PrismaClient } from "../../../shared/lib/prisma/client.ts";

const POOL_CONNECTION_TIMEOUT_MS = 10_000;
const POOL_IDLE_TIMEOUT_MS = 10_000;
const poolLogger = createLogger({ component: "db-pool" });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPool(): Pool {
  const pool = new Pool({
    connectionString: env.POSTGRES_PRISMA_URL,
    max: env.DB_POOL_MAX,
    connectionTimeoutMillis: POOL_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: POOL_IDLE_TIMEOUT_MS,
  });
  pool.on("error", (error) => {
    poolLogger.error({ err: error }, "Idle pg client error");
  });
  return pool;
}

function createPrismaClient(): PrismaClient {
  const pool = globalForPrisma.pool ?? createPool();

  if (!globalForPrisma.pool) {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter }) as PrismaClient;
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export async function cleanup(): Promise<void> {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
  if (globalForPrisma.pool) {
    await globalForPrisma.pool.end();
    globalForPrisma.pool = undefined;
  }
}
