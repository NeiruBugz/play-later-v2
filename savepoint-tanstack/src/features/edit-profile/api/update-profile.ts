import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { isUsernameAvailable, updateProfile } from "@/entities/profile/api";
import type { Profile } from "@/entities/profile/model/types";
import { getServerUserId } from "@/entities/session/api/get-session.server";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/shared/lib/constants";
import { ConflictError, UnauthorizedError } from "@/shared/lib/errors";

const UPDATE_PROFILE_INPUT = z.object({
  name: z.string().min(1).optional(),
  username: z
    .string()
    .min(USERNAME_MIN_LENGTH)
    .max(USERNAME_MAX_LENGTH)
    .optional(),
  image: z.url().optional(),
  isPublicProfile: z.boolean().optional(),
});

const CHECK_USERNAME_INPUT = z.object({
  username: z.string().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH),
});

function safeGetRequest(): Request {
  try {
    return getRequest();
  } catch {
    return new Request("http://localhost");
  }
}

export const updateProfileFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UPDATE_PROFILE_INPUT.parse(data))
  .handler(async ({ data }): Promise<Profile> => {
    const parsed = UPDATE_PROFILE_INPUT.parse(data);

    const userId = await getServerUserId(safeGetRequest());
    if (!userId) {
      throw new UnauthorizedError("Sign in required");
    }

    if (parsed.username !== undefined) {
      const available = await isUsernameAvailable(parsed.username, userId);
      if (!available) {
        throw new ConflictError("Username already taken", {
          username: parsed.username,
        });
      }
    }

    return updateProfile(userId, parsed);
  });

export const checkUsernameFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CHECK_USERNAME_INPUT.parse(data))
  .handler(async ({ data }): Promise<{ available: boolean }> => {
    const userId = await getServerUserId(safeGetRequest());
    const available = await isUsernameAvailable(data.username, userId);
    return { available };
  });
