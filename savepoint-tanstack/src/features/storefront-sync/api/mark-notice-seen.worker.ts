import { z } from "zod";

import { markSyncNoticeSeen } from "@/entities/import-job/api/mark-sync-notice-seen.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export const MARK_SYNC_NOTICE_SEEN_INPUT = z.object({
  jobId: z.string().min(1),
});

export type MarkSyncNoticeSeenInput = z.infer<
  typeof MARK_SYNC_NOTICE_SEEN_INPUT
>;

export async function markSyncNoticeSeenWorker(
  userId: string | undefined,
  data: unknown
): Promise<void> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }
  const input = MARK_SYNC_NOTICE_SEEN_INPUT.parse(data);
  await markSyncNoticeSeen(userId, input.jobId);
}
