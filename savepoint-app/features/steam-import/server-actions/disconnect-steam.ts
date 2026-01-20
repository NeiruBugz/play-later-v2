"use server";

import { SteamService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerAction, type ActionResult } from "@/shared/lib";

const EmptySchema = z.object({});

export const disconnectSteam = createServerAction<Record<string, never>, void>({
  actionName: "disconnectSteam",
  schema: EmptySchema,
  requireAuth: true,
  handler: async ({ userId, logger }): Promise<ActionResult<void>> => {
    logger.info({ userId }, "Disconnecting Steam account");

    const steamService = new SteamService();
    const result = await steamService.disconnectSteam({ userId: userId! });

    if (!result.success) {
      logger.error(
        { userId, error: result.error },
        "Failed to disconnect Steam account"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    revalidatePath("/settings");
    revalidatePath("/profile");

    logger.info({ userId }, "Steam account disconnected successfully");

    return {
      success: true,
      data: undefined,
    };
  },
});
