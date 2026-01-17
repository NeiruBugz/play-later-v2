// NOTE: Environment is loaded in playwright.config.ts before this runs
import { clearTestData, disconnectDatabase } from "./helpers/db";

async function globalTeardown(): Promise<void> {
  const dbName = process.env.POSTGRES_DATABASE ?? "savepoint-db-test";
  console.log(`\n🧹 Running global E2E teardown (database: ${dbName})...`);
  try {
    await clearTestData();
    console.log("✅ Test data cleared successfully");
  } catch (error) {
    console.error("❌ Failed to clear test data:", error);
    throw error;
  } finally {
    await disconnectDatabase();
    console.log("✅ Database connection closed");
  }
}
export default globalTeardown;
