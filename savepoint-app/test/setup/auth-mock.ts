import { vi } from "vitest";

export const mockAuthenticatedUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};
export const mockUnauthenticatedUser = null;

export function setupAuthMocks() {
  if (typeof vi !== "undefined") {
    vi.mock("@/shared/lib/auth", () => ({
      getServerUserId: vi.fn().mockResolvedValue(mockAuthenticatedUser.id),
      requireServerUserId: vi.fn().mockResolvedValue(mockAuthenticatedUser.id),
      getOptionalServerUserId: vi
        .fn()
        .mockResolvedValue(mockAuthenticatedUser.id),
      auth: {
        api: {
          getSession: vi.fn().mockResolvedValue({
            user: mockAuthenticatedUser,
            session: {
              id: "test-session",
              expiresAt: new Date("2025-12-31"),
            },
          }),
        },
      },
    }));
  }
}
