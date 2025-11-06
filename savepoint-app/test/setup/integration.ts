/**
 * Integration Test Setup
 *
 * This file configures the test environment for integration tests that use a real database.
 * Unlike unit tests, integration tests do NOT mock Prisma - they use a real PostgreSQL database.
 *
 * Key differences from unit tests (global.ts):
 * - Uses real database via getTestDatabase() instead of mocked Prisma
 * - Runs in single-fork mode to prevent database conflicts
 * - Has longer timeout (15s vs 10s) for database operations
 */

import { afterEach, beforeAll, vi } from "vitest";

// Import common mocks shared across all test types
import "./common-mocks";

// Import database cleanup function for test isolation
import { resetTestDatabase } from "./database";

// Set up environment variables BEFORE any modules that use them are imported
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.AUTH_SECRET = "test-secret";
process.env.AUTH_URL = "http://localhost:3000";
process.env.AUTH_COGNITO_ID = "test-cognito-id";
process.env.AUTH_COGNITO_SECRET = "test-cognito-secret";
process.env.AUTH_COGNITO_ISSUER =
  "https://cognito-idp.us-east-1.amazonaws.com/test-pool";
process.env.IGDB_CLIENT_ID = "test-igdb-id";
process.env.IGDB_CLIENT_SECRET = "test-igdb-secret";
process.env.POSTGRES_URL = "postgresql://postgres:postgres@localhost:6432/test";
process.env.POSTGRES_PRISMA_URL =
  "postgresql://postgres:postgres@localhost:6432/test";
process.env.POSTGRES_URL_NO_SSL =
  "postgresql://postgres:postgres@localhost:6432/test";
process.env.POSTGRES_URL_NON_POOLING =
  "postgresql://postgres:postgres@localhost:6432/test";
process.env.POSTGRES_HOST = "localhost";
process.env.POSTGRES_USER = "postgres";
process.env.POSTGRES_PASSWORD = "postgres";
process.env.POSTGRES_DATABASE = "test";
process.env.STEAM_API_KEY = "test-steam-key";

// S3 / LocalStack configuration for integration tests
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ENDPOINT_URL = "http://localhost:4568";
process.env.AWS_ACCESS_KEY_ID = "test";
process.env.AWS_SECRET_ACCESS_KEY = "test";
process.env.S3_BUCKET_NAME = "savepoint-dev";
process.env.S3_AVATAR_PATH_PREFIX = "user-avatars/";

/**
 * Override @/shared/lib to use REAL database for integration tests.
 * This replaces the mocked Prisma from global.ts with a real database client.
 */
vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/lib")>();
  const { getTestDatabase } = await import("./database");

  return {
    ...actual,
    // Replace prisma with test database client
    get prisma() {
      return getTestDatabase();
    },
  };
});

/**
 * Unmock repository functions for integration tests.
 * Integration tests should use REAL repository functions with REAL database.
 * The global.ts file mocks these for unit tests, but we need to undo that here.
 */
vi.unmock("@/data-access-layer/repository");

// Set up test-specific configuration before tests run
beforeAll(() => {
  // @ts-expect-error - NODE_ENV is read-only
  process.env.NODE_ENV = "test";
});

/**
 * Clean up after each test to ensure test isolation.
 * This prevents data leakage between tests and eliminates test interdependencies.
 */
afterEach(async () => {
  vi.clearAllMocks();

  // Reset database state between tests
  await resetTestDatabase();
});
