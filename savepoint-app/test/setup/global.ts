/**
 * Global Test Setup for Unit Tests
 *
 * This file configures the test environment for unit tests (utilities, backend, components).
 * It mocks Prisma and other dependencies to provide fast, isolated tests.
 *
 * For integration tests that use a real database, see test/setup/integration.ts
 */

import { afterEach, beforeAll, vi } from "vitest";

// Import common mocks shared across all test types
import "./common-mocks";

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

// S3 / LocalStack configuration
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ENDPOINT_URL = "http://localhost:4568";
process.env.AWS_ACCESS_KEY_ID = "test";
process.env.AWS_SECRET_ACCESS_KEY = "test";
process.env.S3_BUCKET_NAME = "savepoint-dev";
process.env.S3_AVATAR_PATH_PREFIX = "user-avatars/";

/**
 * Mock @/shared/lib with mocked Prisma client for unit tests.
 * Integration tests override this to use a real database.
 */
vi.mock("@/shared/lib", () => {
  const mockLogger = {
    fatal: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(() => mockLogger),
  };

  return {
    prisma: {
      $transaction: vi.fn(),
      game: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      libraryItem: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      review: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    },
    logger: mockLogger,
    createLogger: vi.fn(() => mockLogger),
    hashPassword: vi.fn(async (pwd: string) => `hashed:${pwd}`),
    verifyPassword: vi.fn(
      async (pwd: string, hash: string) => hash === `hashed:${pwd}`
    ),
    getTimeStamp: vi.fn(() => Math.floor(Date.now() / 1000)),
    normalizeString: vi.fn((input: string) =>
      input
        .toLowerCase()
        .replace(/[:-]/g, "")
        .replace(/\bthe\b/g, "")
        .replace(/\s+/g, " ")
        .trim()
    ),
    normalizeGameTitle: vi.fn((input: string) =>
      input
        .replace(
          /[\u2122\u00A9\u00AE\u0024\u20AC\u00A3\u00A5\u2022\u2026]/g,
          ""
        )
        .toLowerCase()
        .trim()
    ),
    convertReleaseDateToIsoStringDate: vi.fn((date?: string) => date),
    LOGGER_CONTEXT: {
      SERVICE: "service",
      SERVER_ACTION: "serverAction",
      PAGE: "page",
      ERROR_BOUNDARY: "errorBoundary",
      STORAGE: "storage",
    },
  };
});

/**
 * Mock NextAuth functions for authentication tests
 */
vi.mock("@/auth", () => ({
  auth: vi.fn(),
  getServerUserId: vi.fn(),
}));

// Add the repository mocks that were in individual test files
vi.mock("@/data-access-layer/repository", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/data-access-layer/repository")>();
  return {
    ...actual,
    createLibraryItem: vi.fn(),
    deleteLibraryItem: vi.fn(),
    updateLibraryItem: vi.fn(),
    getManyLibraryItems: vi.fn(),
    updateUserData: vi.fn(),
    createReview: vi.fn(),
  };
});

// Add the add-game mock
vi.mock("@/features/add-game/server-actions/add-game", () => ({
  saveGameAndAddToLibrary: vi.fn(),
}));

// Set up test-specific configuration before tests run
beforeAll(() => {
  // @ts-expect-error - NODE_ENV is read-only
  process.env.NODE_ENV = "test";
});

declare global {
  var testUtils: {
    createMockFormData: (data: Record<string, string>) => FormData;
  };
}

global.testUtils = {
  createMockFormData: (data: Record<string, string>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  },
};

afterEach(() => {
  vi.clearAllMocks();
});
