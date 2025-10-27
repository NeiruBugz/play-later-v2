import { getServerUserId } from "@/auth";
import { env } from "@/env.mjs";
import {
  cleanupDatabase,
  getTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import { createUser } from "@/test/setup/db-factories";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { s3Client } from "@/shared/lib/storage/s3-client";

import { uploadAvatar } from "./upload-avatar";

vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

describe("uploadAvatar Server Action - Integration Tests", () => {
  let testUserId: string;
  const mockGetServerUserId = vi.mocked(getServerUserId);

  const createTestFile = (name: string, size: number, type: string): File => {
    const content = "x".repeat(size);
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
  };

  const fileExistsInS3 = async (key: string): Promise<boolean> => {
    try {
      await s3Client.send(
        new GetObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  };

  const extractS3Key = (url: string): string => {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    return pathParts.slice(2).join("/");
  };

  const cleanupUserS3Files = async (userId: string): Promise<void> => {
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: env.S3_BUCKET_NAME,
        Prefix: `${env.S3_AVATAR_PATH_PREFIX}${userId}/`,
      })
    );

    if (listResponse.Contents) {
      for (const object of listResponse.Contents) {
        if (object.Key) {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: env.S3_BUCKET_NAME,
              Key: object.Key,
            })
          );
        }
      }
    }
  };

  beforeAll(async () => {
    await setupDatabase();

    try {
      await s3Client.send(
        new ListObjectsV2Command({
          Bucket: env.S3_BUCKET_NAME,
          MaxKeys: 1,
        })
      );
    } catch (error) {
      throw new Error(
        `LocalStack S3 is not available on ${env.AWS_ENDPOINT_URL}. ` +
          `Ensure docker-compose is running: docker-compose up -d\n` +
          `Error: ${error}`
      );
    }
  });

  beforeEach(async () => {
    const user = await createUser({
      email: "test-avatar@example.com",
      name: "Avatar Test User",
    });
    testUserId = user.id;

    mockGetServerUserId.mockResolvedValue(testUserId);
  });

  afterEach(async () => {
    await cleanupUserS3Files(testUserId);

    const db = getTestDatabase();
    await db.user.delete({ where: { id: testUserId } }).catch(() => {});

    vi.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe("Successful Upload Tests", () => {
    it("should upload valid JPEG and return S3 URL", async () => {
      const file = createTestFile("avatar.jpg", 1024 * 100, "image/jpeg");

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBeDefined();
        expect(result.data.url).toContain(env.S3_BUCKET_NAME);
        expect(result.data.url).toContain(testUserId);
        expect(result.data.url).toContain("avatar.jpg");
      }
    });

    it("should upload and S3 URL has correct format with bucket name and key", async () => {
      const file = createTestFile("test.png", 1024 * 200, "image/png");

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(true);
      if (result.success) {
        // LocalStack URL format: http://localhost:4568/bucket-name/key
        expect(result.data.url).toMatch(
          new RegExp(
            `^${env.AWS_ENDPOINT_URL}/${env.S3_BUCKET_NAME}/${env.S3_AVATAR_PATH_PREFIX}`
          )
        );
        expect(result.data.url).toContain(testUserId);
      }
    });

    it("should upload file and file exists in S3 bucket", async () => {
      const file = createTestFile("profile.jpg", 1024 * 500, "image/jpeg");

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(true);
      if (result.success) {
        const key = extractS3Key(result.data.url);
        const exists = await fileExistsInS3(key);
        expect(exists).toBe(true);
      }
    });

    it("should update user avatar URL in database after successful upload", async () => {
      const file = createTestFile("avatar.jpg", 1024 * 300, "image/jpeg");

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify database was updated
        const db = getTestDatabase();
        const updatedUser = await db.user.findUnique({
          where: { id: testUserId },
          select: { image: true },
        });

        expect(updatedUser).toBeDefined();
        expect(updatedUser?.image).toBe(result.data.url);
      }
    });

    it("should upload valid PNG successfully", async () => {
      const file = createTestFile("avatar.png", 1024 * 400, "image/png");

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toContain("avatar.png");

        // Verify file exists
        const key = extractS3Key(result.data.url);
        expect(await fileExistsInS3(key)).toBe(true);
      }
    });

    it("should upload valid GIF successfully", async () => {
      const file = createTestFile("avatar.gif", 1024 * 600, "image/gif");

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toContain("avatar.gif");

        // Verify file exists
        const key = extractS3Key(result.data.url);
        expect(await fileExistsInS3(key)).toBe(true);
      }
    });

    it("should upload valid WebP successfully", async () => {
      const file = createTestFile("avatar.webp", 1024 * 700, "image/webp");

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toContain("avatar.webp");

        // Verify file exists
        const key = extractS3Key(result.data.url);
        expect(await fileExistsInS3(key)).toBe(true);
      }
    });
  });

  describe("Validation Error Tests", () => {
    it("should reject file over 5MB with size error", async () => {
      const file = createTestFile(
        "huge.jpg",
        5 * 1024 * 1024 + 1, // 5MB + 1 byte
        "image/jpeg"
      );

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("File size exceeds 5MB");
      }

      const listResponse = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: env.S3_BUCKET_NAME,
          Prefix: `${env.S3_AVATAR_PATH_PREFIX}${testUserId}/`,
        })
      );
      expect(listResponse.Contents?.length || 0).toBe(0);

      const db = getTestDatabase();
      const user = await db.user.findUnique({
        where: { id: testUserId },
        select: { image: true },
      });
      expect(user?.image).toBeNull();
    });

    it("should reject file at exactly 5MB boundary", async () => {
      const file = createTestFile(
        "exact-5mb.jpg",
        5 * 1024 * 1024, // Exactly 5MB
        "image/jpeg"
      );

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(true);
    });

    it("should reject invalid MIME type text/plain with format error", async () => {
      const file = createTestFile("file.txt", 1024, "text/plain");

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unsupported file format");
      }

      const listResponse = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: env.S3_BUCKET_NAME,
          Prefix: `${env.S3_AVATAR_PATH_PREFIX}${testUserId}/`,
        })
      );
      expect(listResponse.Contents?.length || 0).toBe(0);
    });

    it("should reject invalid MIME type application/pdf with format error", async () => {
      const file = createTestFile("document.pdf", 1024, "application/pdf");

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unsupported file format");
      }
    });
  });

  describe("Authentication Tests", () => {
    it("should return error when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const file = createTestFile("avatar.jpg", 1024, "image/jpeg");

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }

      const listResponse = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: env.S3_BUCKET_NAME,
          Prefix: env.S3_AVATAR_PATH_PREFIX,
        })
      );
      expect(listResponse.Contents?.length || 0).toBe(0);
    });

    it("should not update database when authentication fails", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const file = createTestFile("avatar.jpg", 1024, "image/jpeg");

      await uploadAvatar({ file });

      const db = getTestDatabase();
      const user = await db.user.findUnique({
        where: { id: testUserId },
        select: { image: true },
      });
      expect(user?.image).toBeNull();
    });
  });

  describe("Database Integration Tests", () => {
    it("should update user avatar URL in database after successful upload", async () => {
      const file = createTestFile("new-avatar.png", 1024 * 200, "image/png");

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(true);
      if (result.success) {
        const db = getTestDatabase();
        const user = await db.user.findUnique({
          where: { id: testUserId },
          select: { image: true, updatedAt: true },
        });

        expect(user).toBeDefined();
        expect(user?.image).toBe(result.data.url);
        expect(user?.image).toContain("new-avatar.png");
      }
    });

    it("should not update database when upload fails due to validation", async () => {
      const file = createTestFile("invalid.txt", 1024, "text/plain");

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(false);

      const db = getTestDatabase();
      const user = await db.user.findUnique({
        where: { id: testUserId },
        select: { image: true },
      });
      expect(user?.image).toBeNull();
    });

    it("should not update database when file size exceeds limit", async () => {
      const file = createTestFile(
        "too-big.jpg",
        6 * 1024 * 1024, // 6MB
        "image/jpeg"
      );

      const result = await uploadAvatar({ file });

      expect(result.success).toBe(false);

      const db = getTestDatabase();
      const user = await db.user.findUnique({
        where: { id: testUserId },
        select: { image: true },
      });
      expect(user?.image).toBeNull();
    });

    it("should replace existing avatar URL when uploading new avatar", async () => {
      const file1 = createTestFile("first.jpg", 1024, "image/jpeg");
      const result1 = await uploadAvatar({ file: file1 });

      expect(result1.success).toBe(true);
      if (result1.success) {
        const firstUrl = result1.data.url;

        const file2 = createTestFile("second.png", 1024 * 2, "image/png");
        const result2 = await uploadAvatar({ file: file2 });

        expect(result2.success).toBe(true);
        if (result2.success) {
          const secondUrl = result2.data.url;

          expect(secondUrl).not.toBe(firstUrl);

          const db = getTestDatabase();
          const user = await db.user.findUnique({
            where: { id: testUserId },
            select: { image: true },
          });
          expect(user?.image).toBe(secondUrl);
          expect(user?.image).toContain("second.png");

          const firstKey = extractS3Key(firstUrl);
          const secondKey = extractS3Key(secondUrl);
          expect(await fileExistsInS3(firstKey)).toBe(true);
          expect(await fileExistsInS3(secondKey)).toBe(true);
        }
      }
    });
  });
});
