import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../../shared/lib/prisma/client.ts";

const PG_HOST = "localhost";
const PG_PORT = 6432;
const PG_USER = "postgres";
const PG_PASSWORD = "postgres";
const DOCKER_CONTAINER = "savepoint-postgres";

export const TEST_DB_PREFIX = "savepoint_tanstack_test_";

const SAVEPOINT_TANSTACK_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

export interface IsolatedDatabase {
  url: string;
  prisma: PrismaClient;
  teardown(): Promise<void>;
}

function sanitizeKey(key: string): string {
  const slug = key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!slug) {
    throw new Error("setupIsolatedDatabase: key must contain alphanumerics");
  }
  return slug.slice(0, 40);
}

function dropDatabase(dbName: string): void {
  execSync(
    `docker exec ${DOCKER_CONTAINER} dropdb --if-exists -U ${PG_USER} ${dbName}`,
    { stdio: "ignore" }
  );
}

function createDatabase(dbName: string): void {
  execSync(`docker exec ${DOCKER_CONTAINER} createdb -U ${PG_USER} ${dbName}`, {
    stdio: "ignore",
  });
}

export async function setupIsolatedDatabase(
  key: string
): Promise<IsolatedDatabase> {
  const dbName = `${TEST_DB_PREFIX}${sanitizeKey(key)}`;
  const url = `postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${dbName}`;

  dropDatabase(dbName);
  createDatabase(dbName);

  execSync("pnpm prisma migrate deploy", {
    stdio: "ignore",
    env: {
      ...process.env,
      POSTGRES_PRISMA_URL: url,
      POSTGRES_URL_NON_POOLING: url,
      DATABASE_URL: url,
    },
    cwd: SAVEPOINT_TANSTACK_ROOT,
  });

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
  };
  const previousPrisma = globalForPrisma.prisma;
  const previousPool = globalForPrisma.pool;
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;

  async function teardown() {
    try {
      globalForPrisma.prisma = previousPrisma;
      globalForPrisma.pool = previousPool;
      await prisma.$disconnect();
      await pool.end();
    } finally {
      try {
        dropDatabase(dbName);
      } catch {
        /* best-effort */
      }
    }
  }

  return { url, prisma, teardown };
}
