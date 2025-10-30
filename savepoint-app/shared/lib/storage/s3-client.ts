import { env } from "@/env.mjs";
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.AWS_ENDPOINT_URL, // LocalStack in dev, undefined in prod
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: !!env.AWS_ENDPOINT_URL, // Required for LocalStack
});
