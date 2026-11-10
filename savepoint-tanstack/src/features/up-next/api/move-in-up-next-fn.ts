import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  MOVE_IN_UP_NEXT_INPUT,
  moveInUpNextWorker,
  type MoveInUpNextResult,
} from "./move-in-up-next-fn.worker";

export const moveInUpNextFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => MOVE_IN_UP_NEXT_INPUT.parse(data))
  .handler(async ({ data }): Promise<MoveInUpNextResult> => {
    const userId = await requireUserId();
    return moveInUpNextWorker(userId, data);
  });
