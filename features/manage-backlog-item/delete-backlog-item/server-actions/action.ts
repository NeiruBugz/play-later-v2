"use server";

import { getServerUserId } from "@/auth";
import { BacklogItemService } from "@/domain/backlog-item/service";
import { AuthenticationError } from "@/domain/shared/errors";
import { failure, success } from "@/domain/shared/result";
import { RevalidationService } from "@/shared/ui/revalidation";

export async function deleteBacklogItemAction(
  prevState: { message: string },
  id: number,
  payload: FormData
) {
  // Authentication happens at this level now
  const userId = await getServerUserId();
  if (!userId) {
    return {
      message: "User not authenticated",
    };
  }

  try {
    // Pass userId to the service
    const result = await BacklogItemService.delete(id, userId);

    if (result.isFailure) {
      return {
        message: result.error.message || "Failed to delete backlog item",
      };
    }

    // UI-specific revalidation
    RevalidationService.revalidateCollection();

    return {
      message: "Successfully deleted",
    };
  } catch (error) {
    console.error("Error deleting backlog item:", error);
    return {
      message: "An unexpected error occurred",
    };
  }
}
