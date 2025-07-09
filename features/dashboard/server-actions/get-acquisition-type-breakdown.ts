"use server";

import { getAcquisitionTypeBreakdown as getAcquisitionTypeBreakdownCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getAcquisitionTypeBreakdown = authorizedActionClient
  .metadata({
    actionName: "get-acquisition-type-breakdown",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    const result = await getAcquisitionTypeBreakdownCommand({ userId });
    if (!result) {
      throw new Error("Failed to get acquisition type breakdown");
    }

    const acquisitionBreakdown = result.map((stat) => ({
      type: stat.acquisitionType,
      count: stat._count,
      percentage: Math.round(
        (stat._count / (result.reduce((acc, s) => acc + s._count, 0) ?? 0)) *
          100
      ),
    }));

    return acquisitionBreakdown;
  });
