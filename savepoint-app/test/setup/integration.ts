import { afterEach, beforeAll, vi } from "vitest";

import "./common-mocks";

import { CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

import { resetTestDatabase } from "./database";

// Mock server-only FIRST before any other imports to prevent "Client Component" errors
vi.mock("server-only", () => ({}));

// Mock @/auth to provide a mockable getServerUserId for integration tests
vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

process.env.NEXTAUTH_SECRET = "test-secret";
process.env.AUTH_SECRET = "test-secret";
process.env.AUTH_URL = "http://localhost:3000";
process.env.AUTH_COGNITO_ID = "test-cognito-id";
process.env.AUTH_COGNITO_SECRET = "test-cognito-secret";
process.env.AUTH_COGNITO_ISSUER =
  "https://cognito-idp.us-east-1.amazonaws.com/test-pool";
process.env.IGDB_CLIENT_ID = "test-igdb-id";
process.env.IGDB_CLIENT_SECRET = "test-igdb-secret";
process.env.POSTGRES_URL = "postgresql://postgres:postgres@localhost:6432/test";
process.env.POSTGRES_PRISMA_URL =
  "postgresql://postgres:postgres@localhost:6432/test";
process.env.POSTGRES_URL_NO_SSL =
  "postgresql://postgres:postgres@localhost:6432/test";
process.env.POSTGRES_URL_NON_POOLING =
  "postgresql://postgres:postgres@localhost:6432/test";
process.env.POSTGRES_HOST = "localhost";
process.env.POSTGRES_USER = "postgres";
process.env.POSTGRES_PASSWORD = "postgres";
process.env.POSTGRES_DATABASE = "test";
process.env.STEAM_API_KEY = "test-steam-key";

process.env.AWS_REGION = "us-east-1";
process.env.AWS_ENDPOINT_URL = "http://localhost:4568";
process.env.AWS_ACCESS_KEY_ID = "test";
process.env.AWS_SECRET_ACCESS_KEY = "test";
process.env.S3_BUCKET_NAME = "savepoint-dev";
process.env.S3_AVATAR_PATH_PREFIX = "user-avatars/";
vi.mock("@/shared/lib/app/db", async () => {
  const { getTestDatabase } = await import("./database");
  return {
    get prisma() {
      return getTestDatabase();
    },
  };
});
vi.unmock("@/data-access-layer/repository");

// Unmock @/shared/lib to use real implementations (global.ts mocks it for unit tests)
vi.unmock("@/shared/lib");
async function ensureS3BucketExists(): Promise<void> {
  const { getS3Client, resetS3Client } =
    await import("@/shared/lib/storage/s3-client");
  resetS3Client();
  const s3Client = getS3Client();
  const bucketName = process.env.S3_BUCKET_NAME!;
  try {
    await s3Client.send(
      new HeadBucketCommand({
        Bucket: bucketName,
      })
    );
    console.log(`S3 bucket '${bucketName}' already exists`);
  } catch (error: unknown) {
    const err = error as { name?: string };

    if (err.name === "NotFound" || err.name === "NoSuchBucket") {
      try {
        await s3Client.send(
          new CreateBucketCommand({
            Bucket: bucketName,
          })
        );
        console.log(`Created S3 bucket '${bucketName}' for integration tests`);
      } catch (createError) {
        console.error(
          `Failed to create S3 bucket '${bucketName}':`,
          createError
        );
        throw createError;
      }
    } else {
      console.error(`Failed to check S3 bucket '${bucketName}':`, error);
      throw error;
    }
  }
}

beforeAll(async () => {
  await ensureS3BucketExists();
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

afterEach(async () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  await resetTestDatabase();
});
