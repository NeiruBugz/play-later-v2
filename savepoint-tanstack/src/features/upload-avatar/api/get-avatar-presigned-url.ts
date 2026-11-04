import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  getAvatarPresignedUrlWorker,
  parseAvatarPresignInput,
  type AvatarPresignResult,
} from "./get-avatar-presigned-url.worker";

/**
 * Issues a presigned S3 PUT URL for the signed-in user's avatar, plus the
 * public URL the browser writes back to the profile after the upload.
 */
export const getAvatarPresignedUrlFn = createServerFn({ method: "POST" })
  .inputValidator(parseAvatarPresignInput)
  .handler(async ({ data }): Promise<AvatarPresignResult> => {
    const userId = await requireUserId();
    return getAvatarPresignedUrlWorker(userId, data);
  });
