import { prisma } from "@/shared/lib/db";

/**
 * UX-hint query: live availability check for the username field.
 *
 * Powers the interactive hint as the user types. **Not** an enforcement gate.
 * Username uniqueness is enforced once, by the database unique index on
 * `usernameNormalized`, surfaced as `ConflictError` from
 * `update-profile.server.ts`. Calling this function before an update would
 * re-introduce a TOCTOU race the database constraint already closes.
 *
 * See CONTEXT.md "UX-hint query".
 */
export async function getUsernameAvailability(
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  const normalized = username.toLowerCase().trim();
  const existing = await prisma.user.findFirst({
    where: {
      usernameNormalized: normalized,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
    select: { id: true },
  });
  return !existing;
}
