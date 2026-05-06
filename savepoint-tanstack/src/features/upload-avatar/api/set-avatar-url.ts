import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireUserId } from "@/entities/session/api/require-user-id";
import { prisma } from "@/shared/lib/db";

const SET_AVATAR_URL_INPUT = z.object({
  url: z.url(),
});

/**
 * Persist the final public avatar URL to `User.image` for the signed-in user.
 *
 * The URL is the public S3 object URL produced after the client uploads via
 * the presigned PUT issued by `getAvatarUploadUrlFn`. Ownership is implicit:
 * the user IS the session user. We do not validate the URL points at "our"
 * bucket — that is a content-policy concern out of scope for this slice.
 */
export const setAvatarUrlFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SET_AVATAR_URL_INPUT.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    // Re-parse server-side: inputValidator runs only on network calls;
    // programmatic callers (other server fns, tests) bypass it.
    const parsed = SET_AVATAR_URL_INPUT.parse(data);

    const userId = await requireUserId();

    await prisma.user.update({
      where: { id: userId },
      data: { image: parsed.url },
    });

    return { ok: true } as const;
  });
