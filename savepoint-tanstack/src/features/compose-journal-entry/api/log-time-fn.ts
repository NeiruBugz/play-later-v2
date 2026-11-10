import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  LOG_TIME_INPUT,
  logTimeWorker,
  type LogTimeResult,
} from "./log-time-fn.worker";

export const logTimeFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => LOG_TIME_INPUT.parse(data))
  .handler(async ({ data }): Promise<LogTimeResult> => {
    const userId = await requireUserId();
    return logTimeWorker(userId, data);
  });
