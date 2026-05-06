/**
 * Avatar upload — presigned PUT URL issuance.
 *
 * Validates the requested upload's MIME type (against an allow-list) and
 * declared size (≤10 MB per spec 021 §2.7), then returns a SigV4-presigned
 * S3 PUT URL together with the final public URL the browser should write
 * back to the profile after the upload succeeds.
 *
 * The handler is inlined (not delegating to a co-located worker) because
 * the Start Vite plugin AST-strips the `.handler(arrow)` body on the client
 * build only when its dependency closure is local to the arrow. A top-level
 * worker reference would force `requireUserId` (and its `.server.ts` chain)
 * into the client module graph, which `import-protection` denies.
 *
 * The same worker, exposed for direct test calls, lives in the `.server.ts`
 * companion at `./get-avatar-presigned-url.server.ts` — that file is denied
 * to client importers by the bundler.
 */
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@env";
import { createServerFn } from "@tanstack/react-start";
import { z, ZodError } from "zod";

import { requireUserId } from "@/entities/session/api/require-user-id";
import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  AVATAR_MIME_ALLOW_LIST,
  AVATAR_PATH_PREFIX,
  s3Client,
} from "@/shared/api/s3";
import { ValidationError } from "@/shared/lib/errors";

const PRESIGN_EXPIRES_SECONDS = 300;

const INPUT_SCHEMA = z.object({
  contentType: z.enum(
    AVATAR_MIME_ALLOW_LIST as unknown as [string, ...string[]]
  ),
  contentLength: z.number().int().positive().max(AVATAR_MAX_BYTES),
});

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export const getAvatarPresignedUrlFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
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
  })
  .handler(
    async ({
      data,
    }): Promise<{ uploadUrl: string; publicUrl: string }> => {
      // Re-parse server-side: inputValidator runs only on cross-network
      // calls; programmatic callers (other server fns) bypass it.
      let parsed: z.infer<typeof INPUT_SCHEMA>;
      try {
        parsed = INPUT_SCHEMA.parse(data);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new ValidationError(
            error.issues.map((issue) => issue.message).join("; "),
            { issues: error.issues }
          );
        }
        throw error;
      }

      const userId = await requireUserId();

      const ext = MIME_TO_EXT[parsed.contentType] ?? "bin";
      const key = `${AVATAR_PATH_PREFIX}${userId}/${randomUUID()}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: AVATAR_BUCKET,
        Key: key,
        ContentType: parsed.contentType,
        ContentLength: parsed.contentLength,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: PRESIGN_EXPIRES_SECONDS,
      });

      const publicUrl = env.AWS_ENDPOINT_URL
        ? `${env.AWS_ENDPOINT_URL}/${AVATAR_BUCKET}/${key}`
        : `https://${AVATAR_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

      return { uploadUrl, publicUrl };
    }
  );
