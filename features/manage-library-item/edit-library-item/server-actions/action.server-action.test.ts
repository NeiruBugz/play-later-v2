import { getServerUserId } from "@/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { editLibraryItem } from "@/features/manage-library-item/edit-library-item/server-actions/action";
import { updateLibraryItem as updateLibraryItemRepository } from "@/shared/lib/repository";
import { RevalidationService } from "@/shared/ui/revalidation";

const mockAuthenticatedUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};

describe("editLibraryItem", () => {
  let mockGetServerUserId: ReturnType<typeof vi.mocked<typeof getServerUserId>>;
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerUserId = vi.mocked(getServerUserId);
  });

  it("should reject unauthenticated requests", async () => {
    mockGetServerUserId.mockResolvedValue(undefined);

    const { serverError } = await editLibraryItem(new FormData());

    expect(serverError).toBeDefined();
    expect(serverError).toBe(
      "Authentication required. Please sign in to continue."
    );
  });

  it("should handle authenticated request with invalid payload", async () => {
    mockGetServerUserId.mockResolvedValue(mockAuthenticatedUser.id);

    const newLibraryItem = new FormData();

    newLibraryItem.append("id", "1");
    newLibraryItem.append("status", "CURIOUS_ABOUT");

    const { validationErrors } = await editLibraryItem(newLibraryItem);

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
    vi.mocked(updateLibraryItemRepository).mockRejectedValue(
      new Error("Backlog item not found")
    );

    const newLibraryItem = new FormData();

    newLibraryItem.append("id", "2");
    newLibraryItem.append("status", "CURIOUS_ABOUT");
    newLibraryItem.append("platform", "PC");
    newLibraryItem.append("startedAt", "2025-01-01");

    const { serverError } = await editLibraryItem(newLibraryItem);

    expect(serverError).toBe("Backlog item not found");
  });

  it("should handle authenticated request with valid payload", async () => {
    const revalidateCollectionSpy = vi.spyOn(
      RevalidationService,
      "revalidateCollection"
    );
    mockGetServerUserId.mockResolvedValue(mockAuthenticatedUser.id);

    vi.mocked(updateLibraryItemRepository).mockResolvedValue({
      id: 1,
      userId: mockAuthenticatedUser.id,
      gameId: "1",
      status: "CURIOUS_ABOUT",
      platform: "PC",
      createdAt: new Date(),
      updatedAt: new Date(),
      acquisitionType: "PHYSICAL",
      startedAt: null,
      completedAt: null,
    });

    const newLibraryItem = new FormData();

    newLibraryItem.append("id", "1");
    newLibraryItem.append("status", "EXPERIENCED");
    newLibraryItem.append("platform", "PC");
    newLibraryItem.append("startedAt", "2025-01-01");
    newLibraryItem.append("completedAt", "2025-01-31");

    await editLibraryItem(newLibraryItem);

    expect(revalidateCollectionSpy).toHaveBeenCalled();

    expect(updateLibraryItemRepository).toHaveBeenCalledWith({
      libraryItem: {
        id: 1,
        status: "EXPERIENCED",
        platform: "PC",
        startedAt: new Date("2025-01-01"),
        completedAt: new Date("2025-01-31"),
      },
      userId: mockAuthenticatedUser.id,
    });
  });
});
