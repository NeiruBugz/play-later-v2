import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { deletePlaythrough } from "@/entities/playthrough/api/delete-playthrough.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

export const DELETE_PLAYTHROUGH_INPUT = z.object({
  id: z.string().min(1),
});

export const deletePlaythroughFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DELETE_PLAYTHROUGH_INPUT.parse(data))
  .handler(async ({ data }): Promise<void> => {
    const userId = await requireUserId();
    const parsed = DELETE_PLAYTHROUGH_INPUT.parse(data);
    await deletePlaythrough(userId, parsed.id);
  });
