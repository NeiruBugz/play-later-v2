import { z } from "zod";

import { findGameById } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getGame = authorizedActionClient
  .metadata({
    actionName: "getGame",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      id: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    const game = await findGameById({ id: parsedInput.id });

    return game;
  });
