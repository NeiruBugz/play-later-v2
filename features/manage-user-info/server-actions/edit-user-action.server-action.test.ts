import { getServerUserId } from "@/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateUserData as updateUserDataRepository } from "@/shared/lib/repository";

import { editUserAction } from "./edit-user-action";

describe("editUserAction", () => {
  let mockGetServerUserId: ReturnType<typeof vi.mocked<typeof getServerUserId>>;
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerUserId = vi.mocked(getServerUserId);
  });
  it("should throw authentication error", async () => {
    mockGetServerUserId.mockResolvedValue(undefined);
    const result = await editUserAction({
      username: "test",
    });

    expect(result.serverError).toBe(
      "Authentication required. Please sign in to continue."
    );
  });

  it("should throw validation error for invalid input", async () => {
    mockGetServerUserId.mockResolvedValue("test-user-id");
    const result = await editUserAction({
      username: 123,
    });

    expect(result.serverError).toBeUndefined();
    expect(result.validationErrors?.fieldErrors).toBeDefined();
    expect(result.validationErrors?.fieldErrors?.username).toBeDefined();
    expect(result.validationErrors?.fieldErrors?.username).toEqual([
      "Invalid input: expected string, received number",
    ]);
  });

  it("should update user name", async () => {
    const testUserId = "test-user-id";
    mockGetServerUserId.mockResolvedValue(testUserId);

    vi.mocked(updateUserDataRepository).mockResolvedValue({
      id: testUserId,
      username: "test",
      email: "test@example.com",
      name: "Test User",
      emailVerified: null,
      image: null,
      steamProfileURL: null,
      steamId64: null,
      steamUsername: null,
      steamAvatar: null,
      steamConnectedAt: null,
    });

    const result = await editUserAction({
      username: "test",
    });

    expect(result.serverError).toBeUndefined();
    expect(result.validationErrors).toBeUndefined();

    expect(updateUserDataRepository).toHaveBeenCalledWith({
      userId: testUserId,
      username: "test",
      steamProfileUrl: null,
    });
  });

  it("should update user steam profile url", async () => {
    const testUserId = "test-user-id";
    mockGetServerUserId.mockResolvedValue(testUserId);

    vi.mocked(updateUserDataRepository).mockResolvedValue({
      id: testUserId,
      username: "test",
      email: "test@example.com",
      name: "Test User",
      emailVerified: null,
      image: null,
      steamProfileURL: null,
      steamId64: null,
      steamUsername: null,
      steamAvatar: null,
      steamConnectedAt: null,
    });

    const result = await editUserAction({
      username: "test",
      steamProfileUrl: "steam://profile/1234567890",
    });

    expect(result.serverError).toBeUndefined();
    expect(result.validationErrors).toBeUndefined();

    expect(updateUserDataRepository).toHaveBeenCalledWith({
      userId: testUserId,
      username: "test",
      steamProfileUrl: "steam://profile/1234567890",
    });
  });
});
