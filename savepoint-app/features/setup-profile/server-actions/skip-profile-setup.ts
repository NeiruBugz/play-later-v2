"use server";

import { ProfileService } from "@/data-access-layer/services/profile/profile-service";
import { z } from "zod";

import { createServerAction, type ActionResult } from "@/shared/lib";

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

      logger.info({ userId }, "Profile setup marked as complete (skipped)");
      return { success: true, data: undefined };
    },
  }
);
