import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  ANSWER_PROMPT_INPUT,
  answerPromptWorker,
  type AnswerPromptResult,
} from "./answer-prompt-fn.worker";

export const answerPromptFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => ANSWER_PROMPT_INPUT.parse(data))
  .handler(async ({ data }): Promise<AnswerPromptResult> => {
    const userId = await requireUserId();
    return answerPromptWorker(userId, data);
  });
