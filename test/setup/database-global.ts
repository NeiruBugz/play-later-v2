import { afterAll, afterEach, beforeAll } from "vitest";

import { cleanupDatabase, resetTestDatabase, setupDatabase } from "./database";

// Global test database setup
beforeAll(async () => {
  await setupDatabase();
}, 30000); // 30 second timeout for database setup

afterEach(async () => {
  // Clean up test data after each test
  await resetTestDatabase();
});

afterAll(async () => {
  await cleanupDatabase();
});
