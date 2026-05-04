import { vi } from "vitest";

export const mockAuthenticatedUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};
export const mockUnauthenticatedUser = null;
export function setupAuthMocks() {
  if (typeof vi !== "undefined") {
    vi.mock("@/auth", () => ({
      getServerUserId: vi.fn().mockResolvedValue(mockAuthenticatedUser.id),
    }));
  }
}
