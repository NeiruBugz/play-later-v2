import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import {
  getLibraryStats,
  type LibraryStats,
} from "@/entities/library-item/api";
import { getPublicProfile } from "@/entities/profile/api";
import type { Profile } from "@/entities/profile/model/types";
import { getServerUserId } from "@/entities/session/api/get-session.server";

const inputSchema = z.object({
  username: z.string().min(1),
});

export type PublicProfilePageView = {
  profile: Profile;
  stats: LibraryStats;
};

export const getPublicProfilePageDataFn = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => inputSchema.parse(value))
  .handler(async ({ data }): Promise<PublicProfilePageView> => {
    const { username } = inputSchema.parse(data);
    const viewerId = await getServerUserId(getRequest());
    const profile = await getPublicProfile(username, viewerId ?? undefined);
    const stats = await getLibraryStats(profile.id);
    return { profile, stats };
  });
