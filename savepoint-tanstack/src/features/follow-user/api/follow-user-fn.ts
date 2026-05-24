import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import { FOLLOW_USER_INPUT, followUserWorker } from "./follow-user.worker";

export const followUserFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => FOLLOW_USER_INPUT.parse(data))
  .handler(async ({ data }): Promise<void> => {
    const userId = await requireUserId();
    await followUserWorker(userId, data);
  });
