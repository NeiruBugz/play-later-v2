import { getServerUserId } from "@/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { editBacklogItem } from "@/features/manage-backlog-item/edit-backlog-item/server-actions/action";
import { updateBacklogItem as updateBacklogItemRepository } from "@/shared/lib/repository";
import { RevalidationService } from "@/shared/ui/revalidation";

const mockAuthenticatedUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};

describe("editBacklogItem", () => {
  let mockGetServerUserId: ReturnType<typeof vi.mocked<typeof getServerUserId>>;
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerUserId = vi.mocked(getServerUserId);
  });

  it("should reject unauthenticated requests", async () => {
    mockGetServerUserId.mockResolvedValue(undefined);

    const { serverError } = await editBacklogItem(new FormData());

    expect(serverError).toBeDefined();
    expect(serverError).toBe(
      "Authentication required. Please sign in to continue."
    );
  });

  it("should handle authenticated request with invalid payload", async () => {
    mockGetServerUserId.mockResolvedValue(mockAuthenticatedUser.id);

    const newBacklogItem = new FormData();

    newBacklogItem.append("id", "1");
    newBacklogItem.append("status", "TO_PLAY");

    const { validationErrors } = await editBacklogItem(newBacklogItem);

    expect(validationErrors).toBeDefined();
    expect(JSON.stringify(validationErrors)).toContain(
      JSON.stringify({
        formErrors: [],
        fieldErrors: {
          platform: ["Invalid input: expected string, received undefined"],
        },
      })
    );
  });

  it("should handle authenticated request with valid payload for non-existing backlog item", async () => {
    mockGetServerUserId.mockResolvedValue(mockAuthenticatedUser.id);
    vi.mocked(updateBacklogItemRepository).mockRejectedValue(
      new Error("Backlog item not found")
    );

    const newBacklogItem = new FormData();

    newBacklogItem.append("id", "2");
    newBacklogItem.append("status", "TO_PLAY");
    newBacklogItem.append("platform", "PC");
    newBacklogItem.append("startedAt", "2025-01-01");

    const { serverError } = await editBacklogItem(newBacklogItem);

    expect(serverError).toBe("Backlog item not found");
  });

  it("should handle authenticated request with valid payload", async () => {
    const revalidateCollectionSpy = vi.spyOn(
      RevalidationService,
      "revalidateCollection"
    );
    mockGetServerUserId.mockResolvedValue(mockAuthenticatedUser.id);

    vi.mocked(updateBacklogItemRepository).mockResolvedValue({
      id: 1,
      userId: mockAuthenticatedUser.id,
      gameId: "1",
      status: "TO_PLAY",
      platform: "PC",
      createdAt: new Date(),
      updatedAt: new Date(),
      acquisitionType: "PHYSICAL",
      startedAt: null,
      completedAt: null,
    });

    const newBacklogItem = new FormData();

    newBacklogItem.append("id", "1");
    newBacklogItem.append("status", "COMPLETED");
    newBacklogItem.append("platform", "PC");
    newBacklogItem.append("startedAt", "2025-01-01");
    newBacklogItem.append("completedAt", "2025-01-31");

    await editBacklogItem(newBacklogItem);

    expect(revalidateCollectionSpy).toHaveBeenCalled();

    expect(updateBacklogItemRepository).toHaveBeenCalledWith({
      backlogItem: {
        id: 1,
        status: "COMPLETED",
        platform: "PC",
        startedAt: new Date("2025-01-01"),
        completedAt: new Date("2025-01-31"),
      },
      userId: mockAuthenticatedUser.id,
    });
  });
});
