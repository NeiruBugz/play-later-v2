"use server";

import { SocialService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerAction } from "@/shared/lib";

const FollowUserSchema = z.object({
  followingId: z.string().min(1),
});

type FollowUserInput = z.infer<typeof FollowUserSchema>;

export const followUserAction = createServerAction<FollowUserInput, void>({
  actionName: "followUserAction",
  schema: FollowUserSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { followingId } = input;
    logger.info({ userId, followingId }, "Following user");

    const socialService = new SocialService();
    const result = await socialService.followUser(userId!, followingId);

    if (!result.success) {
      logger.error(
        { error: result.error, userId, followingId },
        "SocialService failed to follow user"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    revalidatePath("/u/[username]", "page");
    logger.info({ userId, followingId }, "User followed successfully");

    return {
      success: true,
      data: undefined,
    };
  },
});
