import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getLibraryStats,
  type LibraryStats,
} from "@/entities/library-item/api/get-library-stats.server";
import { getProfileByUsername } from "@/entities/profile/api/get-profile.server";
import type { Profile } from "@/entities/profile/model/types";
import { NotFoundError } from "@/shared/lib/errors";

const inputSchema = z.object({
  username: z.string().min(1),
});

export type PublicProfileView = {
  profile: Profile;
  stats: LibraryStats;
};

export const getPublicProfileViewFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<PublicProfileView> => {
    const profile = await getProfileByUsername(data.username);

    if (!profile.isPublicProfile) {
      throw new NotFoundError("Profile not found", { username: data.username });
    }

    const stats = await getLibraryStats(profile.id);

    return { profile, stats };
  });
