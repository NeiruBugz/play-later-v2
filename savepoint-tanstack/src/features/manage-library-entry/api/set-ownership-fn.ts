import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  SET_OWNERSHIP_INPUT,
  setOwnershipWorker,
  type SetOwnershipResult,
} from "./set-ownership-fn.worker";

export const setOwnershipFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SET_OWNERSHIP_INPUT.parse(data))
  .handler(async ({ data }): Promise<SetOwnershipResult> => {
    const userId = await requireUserId();
    return setOwnershipWorker(userId, data);
  });
