import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  SAVE_DONE_FOLLOW_UP_INPUT,
  saveDoneFollowUpWorker,
  type SaveDoneFollowUpResult,
} from "./save-done-follow-up-fn.worker";

export const saveDoneFollowUpFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => SAVE_DONE_FOLLOW_UP_INPUT.parse(data))
  .handler(async ({ data }): Promise<SaveDoneFollowUpResult> => {
    const userId = await requireUserId();
    return saveDoneFollowUpWorker(userId, data);
  });
