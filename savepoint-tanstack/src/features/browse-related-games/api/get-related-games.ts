/**
 * `createServerFn` wrapper around the entity query
 * `@/entities/game/api/get-related-games.server.ts`. NO `.server.ts` suffix on
 * THIS file — this file is client-importable per CLAUDE.md foot-gun #1 (the
 * Vite plugin replaces the handler body with an RPC stub on the client build).
 *
 * Worker/entity-query split is the test-harness mitigation for foot-gun #8
 * (createServerFn returns `undefined` when invoked programmatically in vitest
 * without the Vite plugin loaded). The entity query is server-only (`.server.ts`)
 * and tests import it directly.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getRelatedGames } from "@/entities/game/api";

const inputSchema = z.object({
  collectionId: z.number().int().positive(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
});

export const getRelatedGamesFn = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => inputSchema.parse(value))
  .handler(async ({ data }) => getRelatedGames(data));
