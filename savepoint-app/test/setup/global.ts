import { allCustomMatcher } from "aws-sdk-client-mock-vitest";
import { afterEach, beforeAll, beforeEach, expect, vi } from "vitest";

import "./common-mocks";

import { resetUserCounter } from "./db-factories/user";

expect.extend(allCustomMatcher);

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

process.env.AWS_REGION = "us-east-1";
process.env.AWS_ENDPOINT_URL = "http://localhost:4568";
process.env.AWS_ACCESS_KEY_ID = "test";
process.env.AWS_SECRET_ACCESS_KEY = "test";
process.env.S3_BUCKET_NAME = "savepoint-dev";
process.env.S3_AVATAR_PATH_PREFIX = "user-avatars/";
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
    LIBRARY_STATUS_CONFIG: (() => {
      const MockIcon = () => null;
      return [
        {
          value: "WANT_TO_PLAY",
          label: "Want to Play",
          description: "On your radar, haven't started",
          badgeVariant: "wantToPlay",
          icon: MockIcon,
          ariaLabel: "Mark as Want to Play",
        },
        {
          value: "OWNED",
          label: "Owned",
          description: "In your library, haven't started",
          badgeVariant: "owned",
          icon: MockIcon,
          ariaLabel: "Mark as Owned",
        },
        {
          value: "PLAYING",
          label: "Playing",
          description: "Currently engaged",
          badgeVariant: "playing",
          icon: MockIcon,
          ariaLabel: "Mark as Playing",
        },
        {
          value: "PLAYED",
          label: "Played",
          description: "Have experienced it",
          badgeVariant: "played",
          icon: MockIcon,
          ariaLabel: "Mark as Played",
        },
      ];
    })(),
    LIBRARY_STATUS_LABELS: {
      WANT_TO_PLAY: "Want to Play",
      OWNED: "Owned",
      PLAYING: "Playing",
      PLAYED: "Played",
    },
    LIBRARY_STATUS_VARIANTS: {
      WANT_TO_PLAY: "wantToPlay",
      OWNED: "owned",
      PLAYING: "playing",
      PLAYED: "played",
    },
    getStatusLabel: vi.fn((status: string) => {
      const labels: Record<string, string> = {
        WANT_TO_PLAY: "Want to Play",
        OWNED: "Owned",
        PLAYING: "Playing",
        PLAYED: "Played",
      };
      return labels[status] || status;
    }),
    getStatusVariant: vi.fn((status: string) => {
      const variants: Record<string, string> = {
        WANT_TO_PLAY: "wantToPlay",
        OWNED: "owned",
        PLAYING: "playing",
        PLAYED: "played",
      };
      return variants[status] || "secondary";
    }),
    getStatusIcon: vi.fn(() => () => null),
    getStatusConfig: vi.fn((status: string) => {
      const MockIcon = () => null;
      const configs = [
        {
          value: "WANT_TO_PLAY",
          label: "Want to Play",
          icon: MockIcon,
          badgeVariant: "wantToPlay",
          ariaLabel: "Mark as Want to Play",
        },
        {
          value: "OWNED",
          label: "Owned",
          icon: MockIcon,
          badgeVariant: "owned",
          ariaLabel: "Mark as Owned",
        },
        {
          value: "PLAYING",
          label: "Playing",
          icon: MockIcon,
          badgeVariant: "playing",
          ariaLabel: "Mark as Playing",
        },
        {
          value: "PLAYED",
          label: "Played",
          icon: MockIcon,
          badgeVariant: "played",
          ariaLabel: "Mark as Played",
        },
      ];
      return configs.find((c) => c.value === status);
    }),
    createServerAction: vi.fn(() => vi.fn()),
  };
});

vi.mock("@/shared/lib/app/db", () => {
  return {
    prisma: {
      $transaction: vi.fn(),
      game: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findFirst: vi.fn(),
      },
      libraryItem: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      review: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      genre: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        upsert: vi.fn(),
      },
      platform: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        upsert: vi.fn(),
      },
      journal: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});
vi.mock("@/auth", () => ({
  auth: vi.fn(),
  getServerUserId: vi.fn(),
}));

vi.mock("@/data-access-layer/repository", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/data-access-layer/repository")>();
  return {
    ...actual,

    createLibraryItem: vi.fn(),
    deleteLibraryItem: vi.fn(),
    updateLibraryItem: vi.fn(),
    getManyLibraryItems: vi.fn(),

    findUserByEmail: vi.fn(),
    createUserWithCredentials: vi.fn(),
    updateUserData: vi.fn(),

    createReview: vi.fn(),
  };
});

vi.mock("@/features/add-game/server-actions/add-game", () => ({
  saveGameAndAddToLibrary: vi.fn(),
}));

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
beforeEach(() => {
  resetUserCounter();
});

afterEach(() => {
  vi.clearAllMocks();
});
