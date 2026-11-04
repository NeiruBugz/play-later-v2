import { z } from "zod";

import { removeFromUpNext } from "@/entities/library-item/api/remove-from-up-next.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export const REMOVE_FROM_UP_NEXT_INPUT = z.object({
  id: z.number().int().positive(),
});

export type RemoveFromUpNextResult = { position: null };

export async function removeFromUpNextWorker(
  userId: string | undefined,
  data: unknown
): Promise<RemoveFromUpNextResult> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const { id } = REMOVE_FROM_UP_NEXT_INPUT.parse(data);
  return removeFromUpNext(userId, id);
}
