"use server";

import { BacklogItemService } from "@/domain/backlog-item/service";
import { z } from "zod";
import { zfd } from "zod-form-data";

import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

export const deleteBacklogItemAction = authorizedActionClient
  .metadata({
    actionName: "deleteBacklogItem",
    requiresAuth: true,
  })
  .inputSchema(
    zfd.formData({
      id: zfd.numeric(),
    })
  )
  .outputSchema(
    z.object({
      message: z.string(),
    })
  )
  .action(async ({ parsedInput: { id }, ctx: { userId } }) => {
    const result = await BacklogItemService.delete(id, userId);

    if (result.isFailure) {
      return {
        message: result.error.message || "Failed to delete backlog item",
      };
    }

    RevalidationService.revalidateCollection();

    return {
      message: "Successfully deleted",
    };
  });

// export async function deleteBacklogItemAction(
//   prevState: { message: string },
//   id: number,
//   payload: FormData
// ) {
//   // Authentication happens at this level now
//   const userId = await getServerUserId();
//   if (!userId) {
//     return {
//       message: "User not authenticated",
//     };
//   }

//   try {
//     // Pass userId to the service
//     const result = await BacklogItemService.delete(id, userId);

//     if (result.isFailure) {
//       return {
//         message: result.error.message || "Failed to delete backlog item",
//       };
//     }

//     // UI-specific revalidation
//     RevalidationService.revalidateCollection();

//     return {
//       message: "Successfully deleted",
//     };
//   } catch (error) {
//     console.error("Error deleting backlog item:", error);
//     return {
//       message: "An unexpected error occurred",
//     };
//   }
// }
