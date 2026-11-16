import { prisma } from "@/shared/lib/db.server";

import {
  ACTIVE_IMPORT_JOB_STATUSES,
  type ImportJob,
  type Storefront,
} from "../model";

export async function getActiveImportJob(
  userId: string,
  storefront: Storefront
): Promise<ImportJob | null> {
  return prisma.importJob.findFirst({
    where: {
      userId,
      storefront,
      status: { in: [...ACTIVE_IMPORT_JOB_STATUSES] },
    },
  });
}
