import { prisma } from "@/shared/lib/db.server";

import type { ImportJob, Storefront } from "../model/types";
import { expireStaleImportJob } from "./expire-stale-import-job.server";

export async function getLatestImportJob(
  userId: string,
  storefront: Storefront
): Promise<ImportJob | null> {
  await expireStaleImportJob(userId, storefront);

  return prisma.importJob.findFirst({
    where: { userId, storefront },
    orderBy: { createdAt: "desc" },
  });
}
