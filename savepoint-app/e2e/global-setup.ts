import { resolve } from "path";
import { config } from "dotenv";

import { clearTestData, disconnectDatabase } from "./helpers/db";

config({ path: resolve(import.meta.dirname, "../.env") });

async function globalSetup(): Promise<void> {
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
