import { createServerFn } from "@tanstack/react-start";

import type { ListFollowersResult } from "@/entities/follow/model/types";

import {
  LIST_FOLLOWERS_INPUT,
  listFollowersWorker,
} from "./list-followers.worker";

/**
 * Server-fn wrapper for the list-followers read.
 *
 * Anonymous-allowed: no `requireUserId()` — the entity layer enforces the
 * "private target → empty list" privacy invariant on its own.
 */
export const listFollowersFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => LIST_FOLLOWERS_INPUT.parse(data))
  .handler(async ({ data }): Promise<ListFollowersResult> => {
    return listFollowersWorker(undefined, data);
  });
