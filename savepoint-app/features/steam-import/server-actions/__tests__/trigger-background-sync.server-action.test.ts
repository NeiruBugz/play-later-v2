import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { triggerBackgroundSync } from "../trigger-background-sync";

vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

vi.mock("@/shared/lib", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/shared/lib")>();
  return {
    ...original,
    createLogger: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  };
});

const { getServerUserId } = await import("@/auth");
const mockGetServerUserId = getServerUserId as Mock;

describe("triggerBackgroundSync server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerUserId.mockResolvedValue("user-123");
  });

  it("should return disabled error for an authenticated user", async () => {
    const result = await triggerBackgroundSync({ type: "FULL_SYNC" });

    expect(result).toEqual({
      success: false,
      error: "Background sync is currently disabled. Please try again later.",
    });
  });
});
