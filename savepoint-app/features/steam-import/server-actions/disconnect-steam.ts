"use server";

import { SteamService } from "@/data-access-layer/services";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { createServerAction, userTags, type ActionResult } from "@/shared/lib";

const EmptySchema = z.object({});

export const disconnectSteam = createServerAction<Record<string, never>, void>({
  actionName: "disconnectSteam",
  schema: EmptySchema,
  requireAuth: true,
  handler: async ({ userId, logger }): Promise<ActionResult<void>> => {
    logger.info({ userId }, "Disconnecting Steam account");

    const steamService = new SteamService();
    await steamService.disconnectSteam({ userId: userId! });

    revalidateTag(userTags(userId!).steamConnection, "max");
    revalidatePath("/settings");
    revalidatePath("/profile");

    logger.info({ userId }, "Steam account disconnected successfully");

    return {
      success: true,
      data: undefined,
    };
  },
});
