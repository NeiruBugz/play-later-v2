import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import { acknowledgeNoticeWorker } from "./acknowledge-notice-fn.worker";

export const acknowledgeNoticeFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<Record<string, never>> => {
    const userId = await requireUserId();
    return acknowledgeNoticeWorker(userId);
  }
);
