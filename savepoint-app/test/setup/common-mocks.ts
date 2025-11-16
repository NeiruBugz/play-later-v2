import { vi } from "vitest";

/**
 * Common mocks shared across all test types (unit, integration, component).
 * These mocks are safe to apply globally as they don't conflict with test-specific needs.
 */

// Mock server-only module (prevents "server-only" import errors in tests)
vi.mock("server-only", () => ({}));

// Mock environment variables to prevent validation errors during test imports
vi.mock("@/env.mjs", () => ({
  env: {
    // Auth
    AUTH_COGNITO_ID: "test-cognito-id",
    AUTH_COGNITO_SECRET: "test-cognito-secret",
    AUTH_COGNITO_ISSUER:
      "https://cognito-idp.us-east-1.amazonaws.com/test-pool",
    AUTH_SECRET: "test-secret-key-must-be-at-least-32-chars-long",
    AUTH_URL: "http://localhost:3000",
    AUTH_ENABLE_CREDENTIALS: false,
    // IGDB
    IGDB_CLIENT_ID: "test-igdb-client-id",
    IGDB_CLIENT_SECRET: "test-igdb-client-secret",
    // Database
    POSTGRES_URL: "postgresql://postgres:postgres@localhost:6432/test",
    POSTGRES_PRISMA_URL: "postgresql://postgres:postgres@localhost:6432/test",
    POSTGRES_URL_NO_SSL: "postgresql://postgres:postgres@localhost:6432/test",
    POSTGRES_URL_NON_POOLING:
      "postgresql://postgres:postgres@localhost:6432/test",
    POSTGRES_HOST: "localhost",
    POSTGRES_USER: "postgres",
    POSTGRES_PASSWORD: "postgres",
    POSTGRES_DATABASE: "test",
    // Other
    NODE_ENV: "test",
    STEAM_API_KEY: "test-steam-key",
    // S3/AWS
    AWS_REGION: "us-east-1",
    AWS_ENDPOINT_URL: "http://localhost:4568",
    AWS_ACCESS_KEY_ID: "test-access-key",
    AWS_SECRET_ACCESS_KEY: "test-secret-key",
    S3_BUCKET_NAME: "savepoint-test",
    S3_AVATAR_PATH_PREFIX: "user-avatars/",
  },
}));

// Mock IGDB config with test values
vi.mock("@/shared/config/igdb", () => ({
  API_URL: "https://api.igdb.com/v4",
  TOKEN_URL:
    "https://id.twitch.tv/oauth2/token?client_id=test&client_secret=test&grant_type=client_credentials",
}));

// Mock Next.js cache functions
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const redirectError = new Error("NEXT_REDIRECT");
    (redirectError as Error & { digest?: string }).digest = "NEXT_REDIRECT";
    throw redirectError;
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
