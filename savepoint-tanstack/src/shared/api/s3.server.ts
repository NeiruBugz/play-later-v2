import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@env";

const globalForS3 = globalThis as unknown as {
  s3Client: S3Client | undefined;
};

function createS3Client(): S3Client {
  return new S3Client({
    region: env.AWS_REGION,
    endpoint: env.AWS_ENDPOINT_URL,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    // LocalStack requires path-style addressing. In production
    // `AWS_ENDPOINT_URL` is unset so this is `false` and the SDK uses
    // virtual-host-style URLs against AWS's default endpoint.
    forcePathStyle: !!env.AWS_ENDPOINT_URL,
    // AWS SDK v3 ≥ 3.729 flipped the default to "WHEN_SUPPORTED", which
    // auto-adds CRC32 checksum headers to every PutObjectCommand. Those
    // headers then get baked into presigned URLs' `X-Amz-SignedHeaders`,
    // but a browser doing a plain `fetch(url, { method: "PUT", body: file })`
    // can't send them — signature mismatch → 400. Pin to the pre-3.729
    // behavior so presigned uploads work from the browser.
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
}

export const s3Client: S3Client = new Proxy({} as S3Client, {
  get(_target, prop, receiver) {
    if (!globalForS3.s3Client) {
      globalForS3.s3Client = createS3Client();
    }
    const value = Reflect.get(globalForS3.s3Client, prop, receiver);
    return typeof value === "function"
      ? value.bind(globalForS3.s3Client)
      : value;
  },
});

export const AVATAR_BUCKET: string = env.S3_BUCKET_NAME;
export const AVATAR_PATH_PREFIX: string = env.S3_AVATAR_PATH_PREFIX;

export const AVATAR_MIME_ALLOW_LIST: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

// 10 MB — intentionally higher than canonical's 4 MB (DIVERGENCES.md §S021/2.7).
export const AVATAR_MAX_BYTES: number = 10 * 1024 * 1024;
