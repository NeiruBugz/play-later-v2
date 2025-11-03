import { env } from "@/env.mjs";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { s3Client } from "./s3-client";

const logger = createLogger({ [LOGGER_CONTEXT.STORAGE]: "AvatarStorage" });

export class AvatarStorageService {
  /**
   * Upload avatar to S3 and return URL
   */
  static async uploadAvatar(
    userId: string,
    file: File
  ): Promise<
    { ok: true; data: { url: string } } | { ok: false; error: string }
  > {
    try {
      // Validate file
      const maxSize = 4 * 1024 * 1024; // 4MB
      if (file.size > maxSize) {
        return { ok: false, error: "File size exceeds 4MB" };
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        return { ok: false, error: "Unsupported file format" };
      }

      // Generate unique key
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `${env.S3_AVATAR_PATH_PREFIX}${userId}/${timestamp}-${sanitizedName}`;

      // Convert File to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      );

      // Construct URL
      const url = env.AWS_ENDPOINT_URL
        ? `${env.AWS_ENDPOINT_URL}/${env.S3_BUCKET_NAME}/${key}` // LocalStack
        : `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`; // AWS

      logger.info({ userId, key }, "Avatar uploaded successfully");
      return { ok: true, data: { url } };
    } catch (error) {
      logger.error({ error, userId }, "Avatar upload failed");
      return { ok: false, error: "Upload failed. Please try again." };
    }
  }
}
