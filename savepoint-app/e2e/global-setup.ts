import { resolve } from "path";
import { execSync } from "child_process";
import { Pool } from "pg";

// NOTE: Environment is loaded in playwright.config.ts before this runs
import { clearTestData, disconnectDatabase } from "./helpers/db";

async function ensureTestDatabaseExists(): Promise<void> {
  const dbName = process.env.POSTGRES_DATABASE ?? "savepoint-db-test";
  const host = process.env.POSTGRES_HOST ?? "localhost";
  const user = process.env.POSTGRES_USER ?? "postgres";
  const password = process.env.POSTGRES_PASSWORD ?? "postgres";
  const port = 6432;

  // Connect to default 'postgres' database to create test database
  const pool = new Pool({
    host,
    port,
    user,
    password,
    database: "postgres",
  });

  try {
    // Check if database exists
    const result = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`📦 Creating test database: ${dbName}`);
      await pool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Test database created: ${dbName}`);

      // Sync schema to the new database (use db push for test database)
      console.log("🔄 Syncing database schema...");
      execSync("pnpm exec prisma db push", {
        cwd: resolve(import.meta.dirname, ".."),
        stdio: "inherit",
        env: { ...process.env },
      });
      console.log("✅ Schema sync completed");
    }
  } finally {
    await pool.end();
  }
}

async function globalSetup(): Promise<void> {
  const dbName = process.env.POSTGRES_DATABASE ?? "savepoint-db-test";
  console.log(`\n🚀 Running global E2E setup (database: ${dbName})...`);

  try {
    // Ensure test database exists (skip in CI where DB is pre-configured)
    if (!process.env.CI) {
      await ensureTestDatabaseExists();
    }

    await clearTestData();
    console.log("✅ Test data cleared - starting with clean database");
  } catch (error) {
    console.error("❌ Failed to setup E2E tests:", error);
    throw error;
  } finally {
    await disconnectDatabase();
    console.log("✅ Database connection closed");
  }
}
export default globalSetup;
