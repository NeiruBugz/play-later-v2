import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  ADD_TO_UP_NEXT_INPUT,
  addToUpNextWorker,
  type AddToUpNextResult,
} from "./add-to-up-next-fn.worker";

export const addToUpNextFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ADD_TO_UP_NEXT_INPUT.parse(data))
  .handler(async ({ data }): Promise<AddToUpNextResult> => {
    const userId = await requireUserId();
    return addToUpNextWorker(userId, data);
  });
