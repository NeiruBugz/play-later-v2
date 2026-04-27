import { env } from "@/env.mjs";
import { S3Client } from "@aws-sdk/client-s3";

let _s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: env.AWS_REGION,
      endpoint: env.AWS_ENDPOINT_URL,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
      forcePathStyle: !!env.AWS_ENDPOINT_URL,
    });
  }
  return _s3Client;
}

export function resetS3Client(): void {
  _s3Client = null;
}
