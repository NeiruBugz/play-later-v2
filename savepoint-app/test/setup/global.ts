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

// Hoist all mocks to the top level before any imports can happen
vi.mock("server-only", () => ({}));

vi.mock("@/shared/config/igdb", () => ({
  API_URL: "https://api.igdb.com/v4",
  TOKEN_URL: "https://id.twitch.tv/oauth2/token?client_id=test&client_secret=test&grant_type=client_credentials",
}));

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
  };
});

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  getServerUserId: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
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
    getOtherUsersLibraryItems: vi.fn(),
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
