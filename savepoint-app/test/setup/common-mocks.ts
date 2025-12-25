import { vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/env.mjs", () => ({
  env: {
    AUTH_COGNITO_ID: "test-cognito-id",
    AUTH_COGNITO_SECRET: "test-cognito-secret",
    AUTH_COGNITO_ISSUER:
      "https://cognito-idp.us-east-1.amazonaws.com/test-pool",
    AUTH_SECRET: "test-secret-key-must-be-at-least-32-chars-long",
    AUTH_URL: "http://localhost:3000",
    AUTH_ENABLE_CREDENTIALS: false,

    IGDB_CLIENT_ID: "test-igdb-client-id",
    IGDB_CLIENT_SECRET: "test-igdb-client-secret",

    POSTGRES_URL: "postgresql://postgres:postgres@localhost:6432/test",
    POSTGRES_PRISMA_URL: "postgresql://postgres:postgres@localhost:6432/test",
    POSTGRES_URL_NO_SSL: "postgresql://postgres:postgres@localhost:6432/test",
    POSTGRES_URL_NON_POOLING:
      "postgresql://postgres:postgres@localhost:6432/test",
    POSTGRES_HOST: "localhost",
    POSTGRES_USER: "postgres",
    POSTGRES_PASSWORD: "postgres",
    POSTGRES_DATABASE: "test",

    NODE_ENV: "test",
    STEAM_API_KEY: "test-steam-key",

    AWS_REGION: "us-east-1",
    AWS_ENDPOINT_URL: "http://localhost:4568",
    AWS_ACCESS_KEY_ID: "test-access-key",
    AWS_SECRET_ACCESS_KEY: "test-secret-key",
    S3_BUCKET_NAME: "savepoint-dev",
    S3_AVATAR_PATH_PREFIX: "user-avatars/",
  },
}));

vi.mock("@/shared/config/igdb", () => ({
  API_URL: "https://api.igdb.com/v4",
  TOKEN_URL:
    "https://id.twitch.tv/oauth2/token?client_id=test&client_secret=test&grant_type=client_credentials",
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

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

// Mock TipTap modules globally to prevent Node.js v22 stream API compatibility issues
// This fixes the "controller[kState].transformAlgorithm is not a function" error
// Individual test files can override these mocks if they need specific TipTap behavior
vi.mock("@tiptap/react", () => ({
  useEditor: vi.fn(() => null),
  EditorContent: vi.fn(() => null),
}));

vi.mock("@tiptap/starter-kit", () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock("@tiptap/extension-character-count", () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock("@tiptap/extension-list-item", () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));
