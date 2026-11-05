import { z } from "zod";

import { dismissPrompt } from "@/entities/library-item/api/dismiss-prompt.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export const DISMISS_PROMPT_INPUT = z.object({
  id: z.number().int().positive(),
  kind: z.enum(["WHY", "STAYED"]),
});

export type DismissPromptResult = Record<string, never>;

export async function dismissPromptWorker(
  userId: string | undefined,
  data: unknown
): Promise<DismissPromptResult> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const { id, kind } = DISMISS_PROMPT_INPUT.parse(data);
  await dismissPrompt(userId, id, kind);
  return {};
}
