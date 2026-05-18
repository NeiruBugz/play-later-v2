/**
 * Server-only worker for avatar presigned URL issuance.
 *
 * Exposed for direct test calls (the integration test imports this file
 * via the `node` env, where `*.server.*` import protection does not run).
 * The client-importable companion `get-avatar-presigned-url.ts` re-implements
 * the same logic inline inside `createServerFn().handler(...)` so the
 * Start Vite plugin can AST-strip it from the client bundle.
 */
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@env";
import { z, ZodError } from "zod";

import { requireUserId } from "@/entities/session/api/require-user-id";
import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  AVATAR_MIME_ALLOW_LIST,
  AVATAR_PATH_PREFIX,
  s3Client,
} from "@/shared/api/s3.server";
import { ValidationError } from "@/shared/lib/errors";

const PRESIGN_EXPIRES_SECONDS = 300;

const INPUT_SCHEMA = z.object({
  contentType: z.enum(
    AVATAR_MIME_ALLOW_LIST as unknown as [string, ...string[]]
  ),
  contentLength: z.number().int().positive().max(AVATAR_MAX_BYTES),
});

type Input = z.infer<typeof INPUT_SCHEMA>;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

function parseInputOrThrow(data: unknown): Input {
  try {
    return INPUT_SCHEMA.parse(data);
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

function buildPublicUrl(key: string): string {
  if (env.AWS_ENDPOINT_URL) {
    return `${env.AWS_ENDPOINT_URL}/${AVATAR_BUCKET}/${key}`;
  }
  return `https://${AVATAR_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function getAvatarPresignedUrl(
  data: unknown
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const parsed = parseInputOrThrow(data);
  const userId = await requireUserId();
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

  return { uploadUrl, publicUrl: buildPublicUrl(key) };
}
