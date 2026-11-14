import { prisma } from "@/shared/lib/db.server";

import type { ImportJob, Storefront } from "../model/types";

export async function getLatestImportJob(
  userId: string,
  storefront: Storefront
): Promise<ImportJob | null> {
  return prisma.importJob.findFirst({
    where: { userId, storefront },
    orderBy: { createdAt: "desc" },
  });
}
