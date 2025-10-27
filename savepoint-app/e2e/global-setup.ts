import { clearTestData, disconnectDatabase } from "./helpers/db";

/**
 * Playwright global setup
 * Runs once before all test files
 * Ensures a clean database state before tests start
 */
async function globalSetup() {
  console.log("\n🚀 Running global E2E setup...");

  try {
    await clearTestData();
    console.log("✅ Test data cleared - starting with clean database");
  } catch (error) {
    console.error("❌ Failed to clear test data:", error);
    throw error;
  } finally {
    await disconnectDatabase();
    console.log("✅ Database connection closed");
  }
}

export default globalSetup;
