"use server";

import { getServerUserId } from "@/auth";
import { BacklogItemService } from "@/domain/backlog-item/service";
import { RevalidationService } from "@/shared/ui/revalidation";
import { validateEditBacklogItem } from "../lib/validation";

type BacklogStatus =
  | "TO_PLAY"
  | "PLAYED"
  | "PLAYING"
  | "COMPLETED"
  | "WISHLIST";

export async function editBacklogItemAction(
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

  const parsedPayload = validateEditBacklogItem(payload);

  if (!parsedPayload.success) {
    return {
      message: "Invalid payload",
    };
  }

  try {
    const { status, ...restData } = parsedPayload.data;
    // Cast status to the expected type
    const result = await BacklogItemService.update(
      {
        ...restData,
        status: status as BacklogStatus,
      },
      userId
    );

    if (result.isFailure) {
      return {
        message: result.error.message || "Failed to update backlog item",
      };
    }

    // UI-specific revalidation
    RevalidationService.revalidateCollection();

    return {
      message: "Success",
      data: parsedPayload.data,
    };
  } catch (error) {
    return {
      message: "Failed to update backlog item",
    };
  }
}
