"use server";

import { getServerUserId } from "@/auth";
import { BacklogItemService } from "@/domain/backlog-item/service";
import { RevalidationService } from "@/shared/ui/revalidation";
import { BacklogItemStatus } from "@prisma/client";

export async function updateBacklogItemAction({
  id,
  status,
}: {
  id: number;
  status: BacklogItemStatus;
}) {
  // Handle authentication at this level
  const userId = await getServerUserId();
  if (!userId) {
    return {
      message: "User not authenticated",
      success: false,
    };
  }

  try {
    const result = await BacklogItemService.updateStatus(
      {
        id,
        status: status as unknown as BacklogItemStatus,
      },
      userId
    );

    if (result.isFailure) {
      return {
        message: result.error.message || "Failed to update backlog item status",
        success: false,
      };
    }

    // UI-specific revalidation
    RevalidationService.revalidateCollection();

    return {
      message: "Status updated successfully",
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "An unexpected error occurred",
      success: false,
    };
  }
}
