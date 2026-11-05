import { z } from "zod";

import { setDoneOutcome } from "@/entities/library-item/api/set-done-outcome.server";
import { UnauthorizedError } from "@/shared/lib/errors";

import type { DoneOutcome } from "../../../../shared/lib/prisma/client.ts";

export const SET_DONE_OUTCOME_INPUT = z.object({
  id: z.number().int().positive(),
  outcome: z.enum(["FINISHED", "LET_GO"]).nullable(),
});

export type SetDoneOutcomeResult = { doneOutcome: DoneOutcome | null };

export async function setDoneOutcomeWorker(
  userId: string | undefined,
  data: unknown
): Promise<SetDoneOutcomeResult> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const { id, outcome } = SET_DONE_OUTCOME_INPUT.parse(data);
  const { item } = await setDoneOutcome(userId, id, outcome);
  return { doneOutcome: item.doneOutcome };
}
