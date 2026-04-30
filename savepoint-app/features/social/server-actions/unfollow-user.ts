"use server";

import { SocialService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerAction } from "@/shared/lib";

const UnfollowUserSchema = z.object({
  followingId: z.string().min(1),
});
export type UnfollowUserInput = z.infer<typeof UnfollowUserSchema>;

export const unfollowUserAction = createServerAction<UnfollowUserInput, void>({
  actionName: "unfollowUserAction",
  schema: UnfollowUserSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { followingId } = input;

    logger.info({ followingId }, "Attempting to unfollow user");

    const socialService = new SocialService();
    await socialService.unfollowUser(userId!, followingId);

    revalidatePath("/u/[username]", "page");

    logger.info({ userId, followingId }, "User unfollowed successfully");

    return {
      success: true,
      data: undefined,
    };
  },
});
