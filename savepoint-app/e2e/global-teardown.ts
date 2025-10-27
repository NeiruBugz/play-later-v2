import { clearTestData, disconnectDatabase } from "./helpers/db";

/**
 * Playwright global teardown
 * Runs once after all test files have completed
 * Ensures database cleanup even if individual tests fail
 */
async function globalTeardown() {
  console.log("\n🧹 Running global E2E teardown...");

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
