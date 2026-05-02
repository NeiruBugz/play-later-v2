"use server";

import { ProfileService } from "@/data-access-layer/services/profile/profile-service";
import { updateTag } from "next/cache";
import { z } from "zod";

import { createServerAction, userTags, type ActionResult } from "@/shared/lib";

const EmptySchema = z.object({});

export const skipProfileSetup = createServerAction<Record<string, never>, void>(
  {
    actionName: "skipProfileSetup",
    schema: EmptySchema,
    requireAuth: true,
    handler: async ({ userId, logger }): Promise<ActionResult<void>> => {
      logger.info({ userId }, "Marking profile setup as complete (skip)");

      const service = new ProfileService();
      await service.completeSetup({ userId: userId! });

      const tags = userTags(userId!);
      updateTag(tags.setup);
      updateTag(tags.profile);

      logger.info({ userId }, "Profile setup marked as complete (skipped)");
      return { success: true, data: undefined };
    },
  }
);
