import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  MARK_SYNC_NOTICE_SEEN_INPUT,
  markSyncNoticeSeenWorker,
} from "./mark-notice-seen.worker";

export const markSyncNoticeSeenFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => MARK_SYNC_NOTICE_SEEN_INPUT.parse(data))
  .handler(async ({ data }): Promise<void> => {
    const parsed = MARK_SYNC_NOTICE_SEEN_INPUT.parse(data);
    const userId = await requireUserId();
    await markSyncNoticeSeenWorker(userId, parsed);
  });
