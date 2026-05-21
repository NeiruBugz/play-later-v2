import { prisma } from "@/shared/lib/db.server";

/**
 * Distinct, non-empty platform names across the user's entire library —
 * unscoped by any active status/platform/rating filter, mirroring
 * canonical's `getUniquePlatforms` repository query (`distinct: ["platform"]`).
 *
 * This drives the library platform filter's option list so it reflects only
 * the platforms the user actually owns, rather than a hardcoded constant.
 * Returns a sorted, de-duplicated string array; `null`/blank platforms are
 * dropped. Empty library yields `[]`.
 */
export async function getUniqueLibraryPlatforms(
  userId: string
): Promise<string[]> {
  const rows = await prisma.libraryItem.findMany({
    where: { userId },
    select: { platform: true },
    distinct: ["platform"],
  });

  return rows
    .map((row) => row.platform)
    .filter(
      (platform): platform is string =>
        typeof platform === "string" && platform.trim().length > 0
    )
    .sort((a, b) => a.localeCompare(b));
}
