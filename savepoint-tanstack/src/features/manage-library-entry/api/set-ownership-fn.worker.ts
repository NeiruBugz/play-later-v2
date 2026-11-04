import { z } from "zod";

import { setOwnership } from "@/entities/library-item/api/set-ownership.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export const SET_OWNERSHIP_INPUT = z.object({
  id: z.number().int().positive(),
  isOwned: z.boolean(),
});

export type SetOwnershipResult = { isOwned: boolean };

export async function setOwnershipWorker(
  userId: string | undefined,
  data: unknown
): Promise<SetOwnershipResult> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const { id, isOwned } = SET_OWNERSHIP_INPUT.parse(data);
  const { item } = await setOwnership(userId, id, isOwned);

  return { isOwned: item.isOwned };
}
