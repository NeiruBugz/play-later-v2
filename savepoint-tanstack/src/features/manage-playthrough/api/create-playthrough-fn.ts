import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import type { Playthrough } from "../../../../shared/lib/prisma/client.ts";
import {
  CREATE_PLAYTHROUGH_INPUT,
  createPlaythroughWorker,
} from "./create-playthrough-fn.worker";

export const createPlaythroughFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CREATE_PLAYTHROUGH_INPUT.parse(data))
  .handler(async ({ data }): Promise<Playthrough> => {
    const userId = await requireUserId();
    return createPlaythroughWorker(userId, data);
  });
