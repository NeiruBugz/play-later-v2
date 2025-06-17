import { getServerUserId } from "@/auth";
import { BacklogItemService } from "@/domain/backlog-item/service";
import { RevalidationService } from "@/shared/ui/revalidation";
import { BacklogItemStatus } from "@prisma/client";
import { validateCreateBacklogItem } from "../lib/validation";

export async function createBacklogItemAction(
  prevState: { message: string },
  payload: FormData
) {
  // Handle authentication at this level
  const userId = await getServerUserId();
  if (!userId) {
    return {
      message: "User not authenticated",
    };
  }

  const parsedPayload = validateCreateBacklogItem(payload);

  if (!parsedPayload.success) {
    return {
      message: "Invalid payload",
    };
  }

  try {
    const result = await BacklogItemService.create(
      {
        backlogItem: {
          backlogStatus: parsedPayload.data.status as BacklogItemStatus,
          platform: parsedPayload.data.platform,
          startedAt: parsedPayload.data.startedAt,
          completedAt: parsedPayload.data.completedAt,
          acquisitionType: "DIGITAL",
        },
        userId: parsedPayload.data.userId,
        gameId: parsedPayload.data.gameId,
      },
      userId
    );

    if (result.isFailure) {
      return {
        message: result.error.message || "Failed to create backlog item",
      };
    }

    // UI-specific revalidation, separated from domain logic
    RevalidationService.revalidateCollection();

    return {
      message: "Success",
      data: parsedPayload.data,
    };
  } catch (error) {
    return {
      message: "Failed to create backlog item",
    };
  }
}
