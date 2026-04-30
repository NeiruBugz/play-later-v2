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
    await service.dismiss({ userId: userId! });

    revalidatePath("/dashboard");
    logger.info({ userId }, "Onboarding dismissed successfully");
    return { success: true, data: undefined };
  },
});
