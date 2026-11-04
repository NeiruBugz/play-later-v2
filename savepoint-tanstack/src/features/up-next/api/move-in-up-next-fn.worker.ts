import { z } from "zod";

import { moveInUpNext } from "@/entities/library-item/api/move-in-up-next.server";
import { UP_NEXT_MAX } from "@/entities/library-item/model";
import { UnauthorizedError } from "@/shared/lib/errors";

const itemId = z.number().int().positive();

export const MOVE_IN_UP_NEXT_INPUT = z.union([
  z.object({ id: itemId, direction: z.enum(["up", "down"]) }),
  z.object({
    id: itemId,
    toPosition: z.number().int().min(1).max(UP_NEXT_MAX),
  }),
]);

export type MoveInUpNextResult = { id: number; position: number }[];

export async function moveInUpNextWorker(
  userId: string | undefined,
  data: unknown
): Promise<MoveInUpNextResult> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const input = MOVE_IN_UP_NEXT_INPUT.parse(data);
  const target =
    "direction" in input
      ? { direction: input.direction }
      : { toPosition: input.toPosition };
  return moveInUpNext(userId, input.id, target);
}
