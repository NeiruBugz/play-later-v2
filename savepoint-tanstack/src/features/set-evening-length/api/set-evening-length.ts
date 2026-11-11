import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  SET_EVENING_LENGTH_INPUT,
  setEveningLengthWorker,
} from "./set-evening-length.worker";

export const setEveningLengthFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => SET_EVENING_LENGTH_INPUT.parse(data))
  .handler(async ({ data }): Promise<void> => {
    const userId = await requireUserId();
    await setEveningLengthWorker(userId, data);
  });
