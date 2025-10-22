import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

let testDataBase: PrismaClient | undefined;

export const setupDatabase = async () => {
  const testDatabaseName = `test_${nanoid()}`;
  const databaseUrl = `postgresql://postgres:postgres@localhost:6432/${testDatabaseName}`;

  (process.env as any).NODE_ENV = "test";
  process.env.POSTGRES_PRISMA_URL = databaseUrl;
  process.env.POSTGRES_URL_NON_POOLING = databaseUrl;

  try {
    // Use Docker to run PostgreSQL commands
    execSync(
      `docker exec savepoint-postgres dropdb --if-exists -U postgres ${testDatabaseName}`,
      { stdio: "ignore" }
    );
    execSync(
      `docker exec savepoint-postgres createdb -U postgres ${testDatabaseName}`,
      { stdio: "ignore" }
    );

    execSync("pnpm prisma migrate deploy", {
      stdio: "ignore",
      env: { ...process.env, POSTGRES_PRISMA_URL: databaseUrl },
    });

    testDataBase = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });

    await testDataBase.$connect();
    return testDataBase;
  } catch (error) {
    console.error("Error setting up database", error);
    throw error;
  }
};

export const cleanupDatabase = async () => {
  if (testDataBase) {
    await testDataBase.$disconnect();
  }

  const dbName = process.env.POSTGRES_PRISMA_URL?.split("/").pop();
  if (dbName) {
    try {
      execSync(`docker exec savepoint-postgres dropdb -U postgres ${dbName}`, {
        stdio: "ignore",
      });
    } catch (error) {
      console.warn("Failed to cleanup test database:", error);
    }
  }
};

export const resetTestDatabase = async () => {
  if (testDataBase) {
    const tables = await testDataBase.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name != '_prisma_migrations'
    `;

    await testDataBase.$executeRaw`SET session_replication_role = replica;`;
    for (const { table_name } of tables) {
      await testDataBase.$executeRawUnsafe(
        `TRUNCATE TABLE "${table_name}" CASCADE;`
      );
    }

    await testDataBase.$executeRaw`SET session_replication_role = DEFAULT;`;
  }
};

// Export a getter function to ensure testDataBase is initialized
export const getTestDatabase = (): PrismaClient => {
  if (!testDataBase) {
    throw new Error(
      "Test database not initialized. Call setupDatabase() in beforeAll()"
    );
  }
  return testDataBase;
};

// Direct export for backward compatibility (use with caution)
export { testDataBase };
