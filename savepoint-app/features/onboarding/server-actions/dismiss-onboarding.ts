"use server";

import { OnboardingService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerAction, type ActionResult } from "@/shared/lib";

const EmptySchema = z.object({});

export const dismissOnboarding = createServerAction<
  Record<string, never>,
  void
>({
  actionName: "dismissOnboarding",
  schema: EmptySchema,
  requireAuth: true,
  handler: async ({ userId, logger }): Promise<ActionResult<void>> => {
    logger.info({ userId }, "Dismissing onboarding");

    const service = new OnboardingService();
    const result = await service.dismiss({ userId: userId! });

    if (!result.success) {
      logger.error(
        { userId, reason: result.error },
        "Dismiss onboarding failed"
      );
      return { success: false, error: result.error };
    }

    revalidatePath("/dashboard");
    logger.info({ userId }, "Onboarding dismissed successfully");
    return { success: true, data: undefined };
  },
});
