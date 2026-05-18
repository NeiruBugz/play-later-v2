import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { getUsernameAvailability } from "@/entities/profile/api";
import type { Profile } from "@/entities/profile/model/types";
import { getServerUserId } from "@/entities/session/api/get-session.server";
import { requireUserId } from "@/entities/session/api/require-user-id";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/shared/lib/constants";

import {
  UPDATE_PROFILE_INPUT,
  updateProfileWorker,
} from "./update-profile.worker";

const CHECK_USERNAME_INPUT = z.object({
  username: z.string().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH),
});

export const updateProfileFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UPDATE_PROFILE_INPUT.parse(data))
  .handler(async ({ data }): Promise<Profile> => {
    const userId = await requireUserId();
    return updateProfileWorker(userId, data);
  });

// Conditional-read use case (CONTEXT.md "Handler helper vs route-guard server fn"):
// the availability check legitimately runs anonymously during sign-up, so we
// read the optional userId directly via getServerUserId rather than throwing.
export const checkUsernameFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CHECK_USERNAME_INPUT.parse(data))
  .handler(async ({ data }): Promise<{ available: boolean }> => {
    const parsed = CHECK_USERNAME_INPUT.parse(data);
    const userId = await getServerUserId(getRequest());
    const available = await getUsernameAvailability(parsed.username, userId);
    return { available };
  });
