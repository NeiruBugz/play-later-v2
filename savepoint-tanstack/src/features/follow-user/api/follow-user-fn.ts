import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import { FOLLOW_USER_INPUT, followUserWorker } from "./follow-user.worker";

/**
 * Server-fn wrapper for the follow-user mutation.
 *
 * Validate-twice: `inputValidator` runs only on cross-network calls, so the
 * worker re-parses internally to cover programmatic callers (other server
 * fns, tests). See `add-game-to-library-fn.ts` for the original precedent.
 *
 * NOTE: NO `.server.ts` suffix on this filename per foot-gun #1 — only the
 * entity layer uses `.server` as a bundler boundary.
 */
export const followUserFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => FOLLOW_USER_INPUT.parse(data))
  .handler(async ({ data }): Promise<void> => {
    const userId = await requireUserId();
    await followUserWorker(userId, data);
  });
