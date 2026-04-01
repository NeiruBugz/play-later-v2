"use server";

import { SocialService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerAction, type ActionResult } from "@/shared/lib";

const UnfollowUserSchema = z.object({
  followingId: z.string(),
});
export type UnfollowUserInput = z.infer<typeof UnfollowUserSchema>;

export const unfollowUserAction = createServerAction<UnfollowUserInput, void>({
  actionName: "unfollowUserAction",
  schema: UnfollowUserSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }): Promise<ActionResult<void>> => {
    const { followingId } = input;

    logger.info({ followingId }, "Attempting to unfollow user");

    const socialService = new SocialService();
    const result = await socialService.unfollowUser(userId!, followingId);

    if (!result.success) {
      logger.error(
        { error: result.error, userId, followingId },
        "SocialService failed to unfollow user"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    revalidatePath(`/profile/${followingId}`);

    logger.info({ userId, followingId }, "User unfollowed successfully");

    return {
      success: true,
      data: undefined,
    };
  },
});
