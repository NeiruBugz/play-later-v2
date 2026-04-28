"use server";

import { z } from "zod";

import { createServerAction, type ActionResult } from "@/shared/lib";

const TriggerSyncSchema = z.object({
  type: z.enum(["FULL_SYNC", "INCREMENTAL_SYNC"]).default("FULL_SYNC"),
});

type TriggerSyncInput = z.infer<typeof TriggerSyncSchema>;

export const triggerBackgroundSync = createServerAction<
  TriggerSyncInput,
  { message: string }
>({
  actionName: "triggerBackgroundSync",
  schema: TriggerSyncSchema,
  requireAuth: true,
  handler: async ({
    userId,
    logger,
  }): Promise<ActionResult<{ message: string }>> => {
    logger.warn({ userId }, "Background sync feature is disabled");
    return {
      success: false,
      error: "Background sync is currently disabled. Please try again later.",
    };
  },
});
