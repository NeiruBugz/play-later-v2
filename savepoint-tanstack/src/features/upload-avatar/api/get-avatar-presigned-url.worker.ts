import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z, ZodError } from "zod";

import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  AVATAR_MIME_ALLOW_LIST,
  AVATAR_PATH_PREFIX,
  buildAvatarPublicUrl,
  s3Client,
} from "@/shared/api/s3.server";
import { UnauthorizedError, ValidationError } from "@/shared/lib/errors";
import { createLogger } from "@/shared/lib/logger";

const log = createLogger({ scope: "presign-avatar" });
const PRESIGN_EXPIRES_SECONDS = 300;

const AVATAR_PRESIGN_INPUT = z.object({
  contentType: z.enum(
    AVATAR_MIME_ALLOW_LIST as unknown as [string, ...string[]]
  ),
  contentLength: z.number().int().positive().max(AVATAR_MAX_BYTES),
});

type AvatarPresignInput = z.infer<typeof AVATAR_PRESIGN_INPUT>;

export type AvatarPresignResult = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export function parseAvatarPresignInput(data: unknown): AvatarPresignInput {
  try {
    return AVATAR_PRESIGN_INPUT.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(
        error.issues.map((issue) => issue.message).join("; "),
        { issues: error.issues }
      );
    }
    throw error;
  }
}

function buildAvatarKey(userId: string, contentType: string): string {
  const ext = MIME_TO_EXT[contentType] ?? "bin";
  return `${AVATAR_PATH_PREFIX}${userId}/${randomUUID()}.${ext}`;
}

export async function getAvatarPresignedUrlWorker(
  userId: string | undefined,
  data: unknown
): Promise<AvatarPresignResult> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const parsed = parseAvatarPresignInput(data);
  const key = buildAvatarKey(userId, parsed.contentType);

  const command = new PutObjectCommand({
    Bucket: AVATAR_BUCKET,
    Key: key,
    ContentType: parsed.contentType,
    ContentLength: parsed.contentLength,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGN_EXPIRES_SECONDS,
  });

  log.info(
    {
      contentType: parsed.contentType,
      contentLength: parsed.contentLength,
      key,
    },
    "presigned url issued"
  );
  return { uploadUrl, publicUrl: buildAvatarPublicUrl(key), key };
}
