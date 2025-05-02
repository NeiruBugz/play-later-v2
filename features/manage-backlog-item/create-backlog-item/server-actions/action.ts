import { BacklogItemService } from "@/domain/backlog-item/service";
import { validateCreateBacklogItem } from "../lib/validation";

export async function createBacklogItemAction(
  prevState: { message: string },
  payload: FormData
) {
  const parsedPayload = validateCreateBacklogItem(payload);

  if (!parsedPayload.success) {
    return {
      message: "Invalid payload",
    };
  }

  try {
    await BacklogItemService.create({
      backlogItem: {
        backlogStatus: parsedPayload.data.status,
        platform: parsedPayload.data.platform,
        startedAt: parsedPayload.data.startedAt,
        completedAt: parsedPayload.data.completedAt,
        acquisitionType: "DIGITAL",
      },
      userId: parsedPayload.data.userId,
      gameId: parsedPayload.data.gameId,
    });
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
