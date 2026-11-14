import { prisma } from "@/shared/lib/db.server";

import type { CreateImportJobInput, ImportJob } from "../model/types";
import { expireStaleImportJob } from "./expire-stale-import-job.server";

/**
 * Insert a QUEUED job, or return `null` when the user already has an active job
 * for the storefront. The conflict is resolved by the partial unique index
 * `ImportJob_active_userId_storefront_key` (raw-SQL migration, FOOT-GUNS #12),
 * so two concurrent starts yield exactly one job. `null` is a normal outcome,
 * not an error: the caller reads the active job with `getActiveImportJob`.
 * A job idle past the stale window is expired first so it cannot block the
 * insert.
 */
export async function createImportJob(
  userId: string,
  input: CreateImportJobInput
): Promise<ImportJob | null> {
  await expireStaleImportJob(userId, input.storefront);

  const rows = await prisma.$queryRaw<ImportJob[]>`
    INSERT INTO "ImportJob" (
      "id", "userId", "storefront", "addAllToLibrary", "storefrontAccountId",
      "updatedAt"
    )
    VALUES (
      gen_random_uuid()::text,
      ${userId},
      ${input.storefront}::"Storefront",
      ${input.addAllToLibrary},
      ${input.storefrontAccountId},
      now()
    )
    ON CONFLICT DO NOTHING
    RETURNING *
  `;

  return rows[0] ?? null;
}
