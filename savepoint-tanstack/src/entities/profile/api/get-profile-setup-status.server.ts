import {
  NEW_USER_THRESHOLD_MS,
  SUGGESTED_USERNAME_MAX_LENGTH,
} from "@/shared/lib/constants";
import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

/**
 * First-run profile-setup status for the signed-in user.
 *
 * Mirrors `ProfileService.checkSetupStatus` in
 * `savepoint-app/data-access-layer/services/profile/profile-service.ts`:
 *   - `needsSetup` is true when the user has no username OR is still inside
 *     the new-user window (so freshly-onboarded users always see setup once).
 *   - `profileSetupCompletedAt` short-circuits to `needsSetup: false` — once a
 *     user finishes (or skips) setup we never bounce them back.
 *   - `suggestedUsername` is the display name slugified to lowercase
 *     alphanumerics, truncated to `SUGGESTED_USERNAME_MAX_LENGTH`.
 *
 * Not a "specialized subset" of the `Profile` aggregate: the setup-lifecycle
 * columns (`profileSetupCompletedAt`, `createdAt`) are deliberately kept off
 * the display-shaped `Profile` type. Co-located on the profile entity for the
 * same reason as `getOnboardingSignals` — these are User columns.
 *
 * Throws `NotFoundError` if the user does not exist (defensive — callers are
 * always `_authed`-guarded).
 */
export type ProfileSetupStatus = {
  needsSetup: boolean;
  suggestedUsername?: string;
};

export async function getProfileSetupStatus(
  userId: string
): Promise<ProfileSetupStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      name: true,
      profileSetupCompletedAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError("Profile not found", { userId });
  }

  if (user.profileSetupCompletedAt) {
    return { needsSetup: false, suggestedUsername: undefined };
  }

  const thresholdTime = new Date(Date.now() - NEW_USER_THRESHOLD_MS);
  const isNewUser = user.createdAt > thresholdTime;
  const needsSetup = !user.username || isNewUser;

  let suggestedUsername: string | undefined;
  if (needsSetup && user.name) {
    suggestedUsername = user.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, SUGGESTED_USERNAME_MAX_LENGTH);
  }

  return { needsSetup, suggestedUsername };
}
