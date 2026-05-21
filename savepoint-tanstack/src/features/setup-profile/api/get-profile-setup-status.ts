import { createServerFn } from "@tanstack/react-start";

import {
  getProfileSetupStatus,
  type ProfileSetupStatus,
} from "@/entities/profile/api";
import { requireUserId } from "@/entities/session/api/require-user-id";

/**
 * Loader-safe `createServerFn` wrapper around the `getProfileSetupStatus`
 * entity query. Exists so the `/profile/setup` route loader can read the
 * server-only query without importing a `.server.ts` module into the client
 * bundle (foot-gun #2 — the route extractor doesn't strip `.server.ts` from
 * client preload, hanging hover-prefetch).
 */
export const getProfileSetupStatusFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<ProfileSetupStatus> => {
  const userId = await requireUserId();
  return getProfileSetupStatus(userId);
});
