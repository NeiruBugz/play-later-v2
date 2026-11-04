import type { Prisma } from "../../../../shared/lib/prisma/client.ts";

export async function lockUserQueue(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
}

export async function compactQueueAfter(
  tx: Prisma.TransactionClient,
  userId: string,
  vacatedPosition: number
): Promise<void> {
  const behind = await tx.libraryItem.findMany({
    where: { userId, upNextPosition: { gt: vacatedPosition } },
    orderBy: { upNextPosition: "asc" },
    select: { id: true, upNextPosition: true },
  });
  for (const row of behind) {
    await tx.libraryItem.update({
      where: { id: row.id },
      data: { upNextPosition: (row.upNextPosition as number) - 1 },
    });
  }
}

export async function readQueue(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<{ id: number; position: number }[]> {
  const rows = await tx.libraryItem.findMany({
    where: { userId, upNextPosition: { not: null } },
    orderBy: { upNextPosition: "asc" },
    select: { id: true, upNextPosition: true },
  });
  return rows.map((row) => ({
    id: row.id,
    position: row.upNextPosition as number,
  }));
}
