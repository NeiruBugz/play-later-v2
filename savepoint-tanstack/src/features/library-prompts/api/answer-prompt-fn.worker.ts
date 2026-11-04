import { z } from "zod";

import { createJournalEntry } from "@/entities/journal-entry/api/create-journal-entry.server";
import { getLibraryItemGameId } from "@/entities/library-item/api/get-library-item-game-id.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export const PROMPT_KIND = z.enum(["WHY", "STAYED"]);

export const ANSWER_PROMPT_INPUT = z.object({
  id: z.number().int().positive(),
  kind: PROMPT_KIND,
  text: z.string().max(5000),
});

export type AnswerPromptResult = { noteId: string };

export async function answerPromptWorker(
  userId: string | undefined,
  data: unknown
): Promise<AnswerPromptResult> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const { id, kind, text } = ANSWER_PROMPT_INPUT.parse(data);
  const gameId = await getLibraryItemGameId(userId, id);
  const note = await createJournalEntry(userId, {
    gameId,
    content: text,
    prompt: kind,
  });
  return { noteId: note.id };
}
