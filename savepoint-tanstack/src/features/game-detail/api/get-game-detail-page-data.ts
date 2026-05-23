import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import {
  getGameDetails,
  type GameDetails,
} from "@/entities/game/api/get-game-details.server";
import { getServerUserId } from "@/entities/session/api/get-session.server";

const inputSchema = z.object({
  slug: z.string().min(1),
});

export type GameDetailPageView = {
  data: GameDetails;
  viewerUserId: string | null;
};

export const getGameDetailPageDataFn = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => inputSchema.parse(value))
  .handler(async ({ data }): Promise<GameDetailPageView> => {
    const { slug } = inputSchema.parse(data);
    const request = getRequest();
    const userId = await getServerUserId(request);
    const details = await getGameDetails({ slug, userId });

    return {
      data: details,
      viewerUserId: userId ?? null,
    };
  });
