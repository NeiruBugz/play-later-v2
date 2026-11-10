import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  SET_STATUS_INPUT,
  setStatusWorker,
  type SetStatusResult,
} from "./set-status-fn.worker";

export const setStatusFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => SET_STATUS_INPUT.parse(data))
  .handler(async ({ data }): Promise<SetStatusResult> => {
    const userId = await requireUserId();
    return setStatusWorker(userId, data);
  });
