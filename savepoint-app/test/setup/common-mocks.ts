import { vi } from "vitest";

/**
 * Common mocks shared across all test types (unit, integration, component).
 * These mocks are safe to apply globally as they don't conflict with test-specific needs.
 */

// Mock server-only module (prevents "server-only" import errors in tests)
vi.mock("server-only", () => ({}));

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
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
