import { vi } from "vitest";

export const mockAuthenticatedUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};
export const mockUnauthenticatedUser = null;
export function mockAuth(user = mockAuthenticatedUser) {
  return vi.fn().mockResolvedValue(
    user
      ? {
          user,
          expires: "2024-12-31",
        }
      : null
  );
}
export function setupAuthMocks() {
  if (typeof vi !== "undefined") {
    vi.mock("@/auth", () => ({
      auth: mockAuth(),
      getServerUserId: vi.fn().mockResolvedValue(mockAuthenticatedUser.id),
    }));
  }
}
