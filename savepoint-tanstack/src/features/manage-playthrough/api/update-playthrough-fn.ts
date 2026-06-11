import { createServerFn } from "@tanstack/react-start";

import { updatePlaythrough } from "@/entities/playthrough/api/update-playthrough.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

import type { Playthrough } from "../../../../shared/lib/prisma/client.ts";
import { updatePlaythroughSchema } from "../model/playthrough-form.schema";

export const UPDATE_PLAYTHROUGH_INPUT = updatePlaythroughSchema;

export const updatePlaythroughFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UPDATE_PLAYTHROUGH_INPUT.parse(data))
  .handler(async ({ data }): Promise<Playthrough> => {
    const userId = await requireUserId();
    const parsed = UPDATE_PLAYTHROUGH_INPUT.parse(data);
    const { id, playtimeHours, kind, ...rest } = parsed;

    return updatePlaythrough(userId, {
      id,
      ...rest,
      kind: kind ?? undefined,
      ...(playtimeHours !== undefined && {
        playtimeMinutes: Math.round(playtimeHours * 60),
      }),
    });
  });
