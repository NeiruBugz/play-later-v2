import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  SET_DONE_OUTCOME_INPUT,
  setDoneOutcomeWorker,
  type SetDoneOutcomeResult,
} from "./set-done-outcome-fn.worker";

export const setDoneOutcomeFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => SET_DONE_OUTCOME_INPUT.parse(data))
  .handler(async ({ data }): Promise<SetDoneOutcomeResult> => {
    const userId = await requireUserId();
    return setDoneOutcomeWorker(userId, data);
  });
