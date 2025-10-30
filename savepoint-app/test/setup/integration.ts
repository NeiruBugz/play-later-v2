import { afterEach, beforeAll, vi } from "vitest";

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

// Mock server-only module
vi.mock("server-only", () => ({}));

// Mock IGDB config only
vi.mock("@/shared/config/igdb", () => ({
  API_URL: "https://api.igdb.com/v4",
  TOKEN_URL:
    "https://id.twitch.tv/oauth2/token?client_id=test&client_secret=test&grant_type=client_credentials",
}));

// Mock shared/lib to use test database for prisma
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

// Mock Next.js cache functions
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Set up test-specific configuration before tests run
beforeAll(() => {
  // @ts-expect-error - NODE_ENV is read-only
  process.env.NODE_ENV = "test";
});

afterEach(() => {
  vi.clearAllMocks();
});
