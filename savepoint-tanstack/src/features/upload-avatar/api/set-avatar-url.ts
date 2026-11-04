import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  SET_AVATAR_URL_INPUT,
  setAvatarUrlWorker,
} from "./set-avatar-url.worker";

/**
 * Persist the signed-in user's avatar. The client sends only the S3 object
 * `key` returned by the presign step; the server checks it sits under the
 * user's own avatar prefix and derives the public URL itself, so no
 * client-supplied URL is ever stored.
 */
export const setAvatarUrlFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SET_AVATAR_URL_INPUT.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const userId = await requireUserId();
    return setAvatarUrlWorker(userId, data);
  });
