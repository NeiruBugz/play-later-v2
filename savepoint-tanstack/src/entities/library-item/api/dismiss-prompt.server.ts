import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

export type PromptKind = "WHY" | "STAYED";

export async function dismissPrompt(
  userId: string,
  id: number,
  kind: PromptKind
): Promise<void> {
  const owned = await prisma.libraryItem.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!owned) {
    throw new NotFoundError("Library item not found", { itemId: id });
  }

  const now = new Date();
  await prisma.libraryItem.update({
    where: { id },
    data:
      kind === "WHY"
        ? { whyPromptDismissedAt: now }
        : { stayedPromptDismissedAt: now },
  });
}
