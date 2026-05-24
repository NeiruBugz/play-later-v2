import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  UNFOLLOW_USER_INPUT,
  unfollowUserWorker,
} from "./unfollow-user.worker";

export const unfollowUserFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UNFOLLOW_USER_INPUT.parse(data))
  .handler(async ({ data }): Promise<void> => {
    const userId = await requireUserId();
    await unfollowUserWorker(userId, data);
  });
