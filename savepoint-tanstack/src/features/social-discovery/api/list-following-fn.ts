import { createServerFn } from "@tanstack/react-start";

import type { ListFollowingResult } from "@/entities/follow/model/types";

import {
  LIST_FOLLOWING_INPUT,
  listFollowingWorker,
} from "./list-following.worker";

/**
 * Server-fn wrapper for the list-following read.
 *
 * Anonymous-allowed: no `requireUserId()` — the entity layer enforces
 * privacy.
 */
export const listFollowingFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => LIST_FOLLOWING_INPUT.parse(data))
  .handler(async ({ data }): Promise<ListFollowingResult> => {
    return listFollowingWorker(undefined, data);
  });
