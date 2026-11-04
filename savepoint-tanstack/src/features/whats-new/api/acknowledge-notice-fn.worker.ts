import { acknowledgeStatusModelNotice } from "@/entities/profile/api/acknowledge-status-model-notice.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export async function acknowledgeNoticeWorker(
  userId: string | undefined
): Promise<Record<string, never>> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }
  await acknowledgeStatusModelNotice(userId);
  return {};
}
