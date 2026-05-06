import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import {
  getGameDetails,
  type GameDetails,
} from "@/entities/game/api/get-game-details.server";
import { getServerUserId } from "@/entities/session/api/get-session.server";

/**
 * Loader-only server fn for `/games/$slug`.
 *
 * Wraps the entity orchestrator `getGameDetails` and pairs the result with the
 * resolved `viewerUserId` so the route can render `<GameDetail/>` without a
 * second session round-trip on the client.
 *
 * Existence justification: this feature server fn has only one consumer (the
 * route loader at `src/routes/games.$slug.tsx`). Per the strict feature-server-fn
 * rule it should be a loader-direct read, but the bundler caveat (foot-gun #2 in
 * CLAUDE.md) makes that unsafe — the route extractor doesn't strip `.server.ts`
 * imports from the client preload graph, hanging the app on hover-preload. A
 * `createServerFn` wrapper exported from a non-`.server.ts` file is the
 * documented escape hatch.
 *
 * `userId` is read from the request session — never from URL params.
 */

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
    return { data: details, viewerUserId: userId ?? null };
  });
