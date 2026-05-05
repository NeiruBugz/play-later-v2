import { prisma } from "@/shared/lib/db";

export async function isUsernameAvailable(
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
