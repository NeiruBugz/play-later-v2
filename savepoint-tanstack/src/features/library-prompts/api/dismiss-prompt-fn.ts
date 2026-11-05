import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  DISMISS_PROMPT_INPUT,
  dismissPromptWorker,
  type DismissPromptResult,
} from "./dismiss-prompt-fn.worker";

export const dismissPromptFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => DISMISS_PROMPT_INPUT.parse(data))
  .handler(async ({ data }): Promise<DismissPromptResult> => {
    const userId = await requireUserId();
    return dismissPromptWorker(userId, data);
  });
