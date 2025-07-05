import { getServerUserId } from "@/auth";
import { setupAuthMocks } from "@/test/setup/auth-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/shared/lib/db";

import { editUserAction } from "./edit-user-action";

describe("editUserAction", () => {
  beforeEach(() => {
    setupAuthMocks();
    vi.clearAllMocks();
  });
  it("should autnehtication error", async () => {
    vi.mocked(getServerUserId).mockResolvedValue(undefined);
    const result = await editUserAction({
      username: "test",
    });

    expect(result.serverError).toBe(
      "Authentication required. Please sign in to continue."
    );
  });

  it("should throw validation error for invalid input", async () => {
    vi.mocked(getServerUserId).mockResolvedValue("test-user-id");
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
    vi.mocked(getServerUserId).mockResolvedValue(testUserId);

    // Mock the prisma update to resolve successfully
    vi.mocked(prisma.user.update).mockResolvedValue({
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

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: testUserId },
      data: { username: "test" },
    });
  });
});
