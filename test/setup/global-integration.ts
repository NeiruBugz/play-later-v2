import { afterEach, vi } from "vitest";

import { setupAuthMocks } from "./auth-mock";
// Import database setup
import "./database-global";

setupAuthMocks();

// Mock Next.js functions (still needed for integration tests)
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
}));

// Test environment variables
process.env.NEXTAUTH_SECRET = "test-secret";
(process.env as any).NODE_ENV = "test";

// Required by t3-env (all server env vars must be set)
process.env.AUTH_GOOGLE_ID = "test-google-id";
process.env.AUTH_GOOGLE_SECRET = "test-google-secret";
process.env.AUTH_SECRET = "test-auth-secret";
process.env.AUTH_URL = "http://localhost:3000";
process.env.IGDB_CLIENT_ID = "test-igdb-client-id";
process.env.IGDB_CLIENT_SECRET = "test-igdb-client-secret";
process.env.LINEAR_API_KEY = "test-linear-api-key";
process.env.LINEAR_PROJECT_ID = "test-linear-project-id";
process.env.POSTGRES_DATABASE = "test-db";
process.env.POSTGRES_HOST = "localhost";
process.env.POSTGRES_PASSWORD = "postgres";
process.env.POSTGRES_URL =
  "postgresql://postgres:postgres@localhost:6432/test-db";
process.env.POSTGRES_URL_NO_SSL =
  "postgresql://postgres:postgres@localhost:6432/test-db";
process.env.POSTGRES_USER = "postgres";
process.env.STEAM_API_KEY = "test-steam-api-key";

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
