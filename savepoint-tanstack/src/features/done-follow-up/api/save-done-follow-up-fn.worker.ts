import { z } from "zod";

import { saveDoneFollowUp } from "@/entities/library-item/api/save-done-follow-up.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export const SAVE_DONE_FOLLOW_UP_INPUT = z.object({
  id: z.number().int().positive(),
  outcome: z.enum(["FINISHED", "LET_GO"]).nullable().optional(),
  rating: z.number().int().min(1).max(10).nullable().optional(),
  stayed: z.string().max(5000).optional(),
});

export type SaveDoneFollowUpResult = { noteId?: string };

export async function saveDoneFollowUpWorker(
  userId: string | undefined,
  data: unknown
): Promise<SaveDoneFollowUpResult> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const { id, ...input } = SAVE_DONE_FOLLOW_UP_INPUT.parse(data);
  return saveDoneFollowUp(userId, id, input);
}
