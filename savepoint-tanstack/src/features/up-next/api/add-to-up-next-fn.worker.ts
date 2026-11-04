import { z } from "zod";

import { addToUpNext } from "@/entities/library-item/api/add-to-up-next.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export const ADD_TO_UP_NEXT_INPUT = z.object({
  id: z.number().int().positive(),
});

export type AddToUpNextResult = { position: number };

export async function addToUpNextWorker(
  userId: string | undefined,
  data: unknown
): Promise<AddToUpNextResult> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const { id } = ADD_TO_UP_NEXT_INPUT.parse(data);
  return addToUpNext(userId, id);
}
