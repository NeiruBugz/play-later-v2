import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

/**
 * Onboarding signals for the first-time `/library` checklist.
 *
 * Returns the 3 viewer-scoped flags that the OnboardingChecklist needs:
 *   - `image`             — avatar URL (null = profile-setup step undone)
 *   - `steamId64`         — Steam ID linked (null = Steam step undone)
 *   - `journalEntryCount` — number of journal entries authored by viewer
 *
 * Not a "specialized subset" of any existing aggregate: this is the
 * onboarding-specific projection. Co-located on the profile entity
 * because two of the three fields are User columns.
 *
 * Throws `NotFoundError` if the user does not exist (defensive — the
 * caller is always `_authed`-guarded so this should not happen in
 * practice).
 */
export type OnboardingSignals = {
  image: string | null;
  steamId64: string | null;
  journalEntryCount: number;
};

export async function getOnboardingSignals(
  userId: string
): Promise<OnboardingSignals> {
  const [user, journalEntryCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { image: true, steamId64: true },
    }),
    prisma.journalEntry.count({ where: { userId } }),
  ]);

  if (!user) {
    throw new NotFoundError("User not found", { userId });
  }

  return {
    image: user.image,
    steamId64: user.steamId64,
    journalEntryCount,
  };
}
