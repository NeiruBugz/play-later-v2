import { getServerUserId } from "@/auth";
import { BacklogItemService } from "@/domain/backlog-item/service";
import { editBacklogItem } from "@/features/manage-backlog-item/edit-backlog-item/server-actions/action";
import { prisma } from "@/shared/lib/db";
import { RevalidationService } from "@/shared/ui/revalidation";
import { BacklogItem } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockAuthenticatedUser,
  setupAuthMocks,
} from "../../../../test/setup/auth-mock";

describe("editBacklogItem", () => {
  beforeEach(() => {
    setupAuthMocks();
    vi.clearAllMocks();
  });

  it("should reject unauthenticated requests", async () => {
    vi.mocked(getServerUserId).mockResolvedValue(undefined);

    const { serverError } = await editBacklogItem(new FormData());

    expect(serverError).toBeDefined();
    expect(serverError).toBe("Oh no, something went wrong!");
  });

  it("should handle authenticated request with invalid payload", async () => {
    vi.mocked(getServerUserId).mockResolvedValue(mockAuthenticatedUser.id);

    const newBacklogItem = new FormData();

    newBacklogItem.append("id", "1");
    newBacklogItem.append("status", "TO_PLAY");

    const { validationErrors } = await editBacklogItem(newBacklogItem);

    console.log(validationErrors);

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
    vi.mocked(getServerUserId).mockResolvedValue(mockAuthenticatedUser.id);
    vi.mocked(prisma.backlogItem.findUnique).mockResolvedValue(null);

    const newBacklogItem = new FormData();

    newBacklogItem.append("id", "2");
    newBacklogItem.append("status", "TO_PLAY");
    newBacklogItem.append("platform", "PC");
    newBacklogItem.append("startedAt", "2025-01-01");

    const { data } = await editBacklogItem(newBacklogItem);

    expect(data?.message).toBe("BacklogItem with id 2 not found");
  });

  it("should handle authenticated request with valid payload", async () => {
    const revalidateCollectionSpy = vi.spyOn(
      RevalidationService,
      "revalidateCollection"
    );
    const updateSpy = vi.spyOn(BacklogItemService, "update");
    vi.mocked(getServerUserId).mockResolvedValue(mockAuthenticatedUser.id);

    vi.mocked(prisma.backlogItem.findUnique).mockResolvedValue({
      id: 1,
      userId: mockAuthenticatedUser.id,
      gameId: "1",
      status: "TO_PLAY",
      platform: "PC",
      startedAt: new Date("2025-01-01"),
      completedAt: null,
      createdAt: new Date(),
    } as BacklogItem);

    const newBacklogItem = new FormData();

    newBacklogItem.append("id", "1");
    newBacklogItem.append("status", "COMPLETED");
    newBacklogItem.append("platform", "PC");
    newBacklogItem.append("startedAt", "2025-01-01");
    newBacklogItem.append("completedAt", "2025-01-31");

    const { data, serverError, validationErrors } =
      await editBacklogItem(newBacklogItem);

    console.log(data, serverError, validationErrors);

    expect(data?.message).toBe("Success");

    //   id: 1,
    //   status: "COMPLETED",
    //   platform: "PC",
    //   startedAt: new Date("2025-01-01"),
    //   completedAt: new Date("2025-01-31"),
    // });

    expect(revalidateCollectionSpy).toHaveBeenCalled();
    expect(prisma.backlogItem.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { userId: true },
    });

    expect(updateSpy).toHaveBeenCalledWith(
      {
        id: 1,
        platform: "PC",
        status: "COMPLETED",
        startedAt: new Date("2025-01-01"),
        completedAt: new Date("2025-01-31"),
      },
      mockAuthenticatedUser.id
    );
  });
});
