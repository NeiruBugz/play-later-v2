import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  UNFOLLOW_USER_INPUT,
  unfollowUserWorker,
} from "./unfollow-user.worker";

/**
 * Server-fn wrapper for the unfollow-user mutation.
 *
 * Validate-twice: `inputValidator` runs only on cross-network calls, so the
 * worker re-parses internally to cover programmatic callers.
 */
export const unfollowUserFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UNFOLLOW_USER_INPUT.parse(data))
  .handler(async ({ data }): Promise<void> => {
    const userId = await requireUserId();
    await unfollowUserWorker(userId, data);
  });
