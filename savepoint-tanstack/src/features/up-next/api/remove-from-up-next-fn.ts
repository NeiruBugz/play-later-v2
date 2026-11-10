import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  REMOVE_FROM_UP_NEXT_INPUT,
  removeFromUpNextWorker,
  type RemoveFromUpNextResult,
} from "./remove-from-up-next-fn.worker";

export const removeFromUpNextFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => REMOVE_FROM_UP_NEXT_INPUT.parse(data))
  .handler(async ({ data }): Promise<RemoveFromUpNextResult> => {
    const userId = await requireUserId();
    return removeFromUpNextWorker(userId, data);
  });
