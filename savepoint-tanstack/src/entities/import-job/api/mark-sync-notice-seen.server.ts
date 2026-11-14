import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

/**
 * Mark a sync's finished/failed notice seen: sets `noticeSeenAt` on the job
 * and on every older FINISHED or FAILED job of the same user and storefront
 * that is still unseen, so nothing stale resurfaces on the next visit. Newer
 * jobs, other users' and other storefronts' jobs are untouched, and a job
 * already seen keeps its original timestamp.
 *
 * Throws `NotFoundError` for a missing job and for another user's job alike
 * (anti-enumeration), writing nothing.
 */
export async function markSyncNoticeSeen(
  userId: string,
  jobId: string
): Promise<void> {
  const job = await prisma.importJob.findFirst({
    where: { id: jobId, userId },
    select: { id: true },
  });
  if (!job) throw new NotFoundError("Import job not found");

  await prisma.$executeRaw`
    UPDATE "ImportJob" AS target
    SET "noticeSeenAt" = now(), "updatedAt" = now()
    FROM "ImportJob" AS marked
    WHERE marked."id" = ${jobId}
      AND marked."userId" = ${userId}
      AND target."userId" = marked."userId"
      AND target."storefront" = marked."storefront"
      AND target."noticeSeenAt" IS NULL
      AND (
        target."id" = marked."id"
        OR (
          target."status" IN ('FINISHED', 'FAILED')
          AND target."createdAt" < marked."createdAt"
        )
      )
  `;
}
