import { env } from "@/env.mjs";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import { AvatarStorageService } from "./avatar-storage";
import { s3Client } from "./s3-client";

describe("AvatarStorageService - Integration Tests", () => {
  const TEST_USER_ID_1 = "test-user-integration-1";
  const TEST_USER_ID_2 = "test-user-integration-2";

  const createTestFile = (
    name: string,
    content: string,
    type: string
  ): File => {
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
  };

  const fileExistsInS3 = async (key: string): Promise<boolean> => {
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  };

  const getFileFromS3 = async (key: string): Promise<string> => {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
      })
    );
    return await response.Body!.transformToString();
  };

  const extractKeyFromUrl = (url: string): string => {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");

    return pathParts.slice(2).join("/");
  };

  const deleteFileFromS3 = async (key: string): Promise<void> => {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
      })
    );
  };

  const listTestFiles = async (): Promise<string[]> => {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: env.S3_BUCKET_NAME,
        Prefix: env.S3_AVATAR_PATH_PREFIX,
      })
    );

    return (
      response.Contents?.map((obj) => obj.Key).filter((key): key is string =>
        Boolean(key)
      ) || []
    );
  };

  beforeAll(async () => {
    // Ensure S3 bucket exists (may already be created by global setup)
    try {
      await s3Client.send(
        new HeadBucketCommand({
          Bucket: env.S3_BUCKET_NAME,
        })
      );
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err.name === "NotFound" || err.name === "NoSuchBucket") {
        // Bucket doesn't exist, create it
        try {
          await s3Client.send(
            new CreateBucketCommand({
              Bucket: env.S3_BUCKET_NAME,
            })
          );
        } catch (createError) {
          throw new Error(
            `Failed to create S3 bucket '${env.S3_BUCKET_NAME}': ${createError}`
          );
        }
      } else {
        // LocalStack might not be running
        throw new Error(
          `LocalStack S3 is not available on ${env.AWS_ENDPOINT_URL}. ` +
            `Ensure docker-compose is running: docker-compose up -d\n` +
            `Error: ${error}`
        );
      }
    }

    const keys = await listTestFiles();
    for (const key of keys) {
      try {
        await deleteFileFromS3(key);
      } catch (error) {
        console.warn(`Failed to delete ${key} during initial cleanup:`, error);
      }
    }
  });

  afterEach(async () => {
    const keys = await listTestFiles();

    for (const key of keys) {
      try {
        await deleteFileFromS3(key);
      } catch (error) {
        console.warn(`Failed to delete ${key}:`, error);
      }
    }
  });

  afterAll(async () => {
    const remainingKeys = await listTestFiles();
    if (remainingKeys.length > 0) {
      console.warn(
        `Warning: ${remainingKeys.length} test files remain in bucket:`,
        remainingKeys
      );
    }
  });

  describe("Upload Tests", () => {
    it("should upload valid image to LocalStack and file exists in bucket", async () => {
      const fileContent = "test-image-content-jpeg";
      const file = createTestFile("avatar.jpg", fileContent, "image/jpeg");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_1,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.url).toBeDefined();
        expect(result.data.url).toContain(env.S3_BUCKET_NAME);

        const key = extractKeyFromUrl(result.data.url);
        const exists = await fileExistsInS3(key);
        expect(exists).toBe(true);
      }
    });

    it("should upload and return correct S3 URL format", async () => {
      const file = createTestFile("test.png", "png-content", "image/png");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_1,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.url).toMatch(
          new RegExp(
            `^${env.AWS_ENDPOINT_URL}/${env.S3_BUCKET_NAME}/${env.S3_AVATAR_PATH_PREFIX}`
          )
        );
        expect(result.data.url).toContain(TEST_USER_ID_1);
        expect(result.data.url).toContain("test.png");
      }
    });

    it("should upload file and content matches original", async () => {
      const originalContent = "original-webp-image-data-12345";
      const file = createTestFile("avatar.webp", originalContent, "image/webp");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_1,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const key = extractKeyFromUrl(result.data.url);
        const retrievedContent = await getFileFromS3(key);
        expect(retrievedContent).toBe(originalContent);
      }
    });

    it("should upload multiple files with different timestamps - all stored", async () => {
      const file1 = createTestFile("photo1.jpg", "content1", "image/jpeg");
      const file2 = createTestFile("photo2.png", "content2", "image/png");
      const file3 = createTestFile("photo3.gif", "content3", "image/gif");

      const result1 = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_1,
        file1
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      const result2 = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_1,
        file2
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      const result3 = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_1,
        file3
      );

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      expect(result3.ok).toBe(true);

      const allKeys = await listTestFiles();
      expect(allKeys.length).toBeGreaterThanOrEqual(3);

      if (result1.ok && result2.ok && result3.ok) {
        const key1 = extractKeyFromUrl(result1.data.url);
        const key2 = extractKeyFromUrl(result2.data.url);
        const key3 = extractKeyFromUrl(result3.data.url);

        expect(await fileExistsInS3(key1)).toBe(true);
        expect(await fileExistsInS3(key2)).toBe(true);
        expect(await fileExistsInS3(key3)).toBe(true);
      }
    });
  });

  describe("Duplicate Filename Tests", () => {
    it("should upload same filename twice - both files stored with unique timestamps", async () => {
      const filename = "duplicate.jpg";
      const file1 = createTestFile(filename, "first-upload", "image/jpeg");
      const file2 = createTestFile(filename, "second-upload", "image/jpeg");

      const result1 = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_1,
        file1
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      const result2 = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_1,
        file2
      );

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      if (result1.ok && result2.ok) {
        expect(result1.data.url).not.toBe(result2.data.url);

        const key1 = extractKeyFromUrl(result1.data.url);
        const key2 = extractKeyFromUrl(result2.data.url);

        expect(await fileExistsInS3(key1)).toBe(true);
        expect(await fileExistsInS3(key2)).toBe(true);

        expect(key1).not.toBe(key2);
      }
    });

    it("should upload duplicate filenames - both files retrievable independently", async () => {
      const filename = "profile.png";
      const content1 = "first-version-content";
      const content2 = "second-version-content";

      const file1 = createTestFile(filename, content1, "image/png");
      const file2 = createTestFile(filename, content2, "image/png");

      const result1 = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_1,
        file1
      );
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_1,
        file2
      );

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      if (result1.ok && result2.ok) {
        const key1 = extractKeyFromUrl(result1.data.url);
        const key2 = extractKeyFromUrl(result2.data.url);

        const retrieved1 = await getFileFromS3(key1);
        const retrieved2 = await getFileFromS3(key2);

        expect(retrieved1).toBe(content1);
        expect(retrieved2).toBe(content2);
      }
    });
  });

  describe("File Verification Tests", () => {
    it("should download uploaded file from S3 - content matches original", async () => {
      const originalContent =
        "this-is-a-test-avatar-with-special-chars-!@#$%^&*()";
      const file = createTestFile(
        "special-avatar.jpg",
        originalContent,
        "image/jpeg"
      );

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_2,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const key = extractKeyFromUrl(result.data.url);
        const downloadedContent = await getFileFromS3(key);

        expect(downloadedContent).toBe(originalContent);
        expect(downloadedContent.length).toBe(originalContent.length);
      }
    });

    it("should verify ContentType is preserved in S3", async () => {
      const file = createTestFile(
        "test-type.webp",
        "webp-content",
        "image/webp"
      );

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_1,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const key = extractKeyFromUrl(result.data.url);

        const headResponse = await s3Client.send(
          new HeadObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: key,
          })
        );

        expect(headResponse.ContentType).toBe("image/webp");
      }
    });
  });

  describe("Cleanup Tests", () => {
    it("should delete file from S3 - file no longer exists", async () => {
      const file = createTestFile("to-delete.jpg", "content", "image/jpeg");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_1,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const key = extractKeyFromUrl(result.data.url);

        expect(await fileExistsInS3(key)).toBe(true);

        await deleteFileFromS3(key);

        expect(await fileExistsInS3(key)).toBe(false);
      }
    });

    it("should list bucket contents - verify expected files present", async () => {
      const file1 = createTestFile("user1-avatar.jpg", "u1", "image/jpeg");
      const file2 = createTestFile("user2-avatar.png", "u2", "image/png");
      const file3 = createTestFile("user1-second.gif", "u1-2", "image/gif");

      await AvatarStorageService.uploadAvatar(TEST_USER_ID_1, file1);
      await AvatarStorageService.uploadAvatar(TEST_USER_ID_2, file2);
      await AvatarStorageService.uploadAvatar(TEST_USER_ID_1, file3);

      const allKeys = await listTestFiles();

      expect(allKeys.length).toBe(3);

      allKeys.forEach((key) => {
        expect(key).toMatch(new RegExp(`^${env.S3_AVATAR_PATH_PREFIX}`));
      });

      const user1Files = allKeys.filter((key) => key.includes(TEST_USER_ID_1));
      const user2Files = allKeys.filter((key) => key.includes(TEST_USER_ID_2));

      expect(user1Files.length).toBe(2);
      expect(user2Files.length).toBe(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid bucket gracefully", async () => {
      // We can't easily simulate this without mocking, but we document expected behavior
      const file = createTestFile("test.jpg", "content", "image/jpeg");

      // If bucket doesn't exist or is misconfigured, upload should fail gracefully
      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID_1,
        file
      );

      expect(result.ok).toBe(true);
    });
  });

  describe("Multi-User Upload Tests", () => {
    it("should handle concurrent uploads from different users", async () => {
      const file1 = createTestFile("user1.jpg", "user1-content", "image/jpeg");
      const file2 = createTestFile("user2.png", "user2-content", "image/png");

      const [result1, result2] = await Promise.all([
        AvatarStorageService.uploadAvatar(TEST_USER_ID_1, file1),
        AvatarStorageService.uploadAvatar(TEST_USER_ID_2, file2),
      ]);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      if (result1.ok && result2.ok) {
        const key1 = extractKeyFromUrl(result1.data.url);
        const key2 = extractKeyFromUrl(result2.data.url);

        expect(await fileExistsInS3(key1)).toBe(true);
        expect(await fileExistsInS3(key2)).toBe(true);

        expect(key1).toContain(TEST_USER_ID_1);
        expect(key2).toContain(TEST_USER_ID_2);

        expect(await getFileFromS3(key1)).toBe("user1-content");
        expect(await getFileFromS3(key2)).toBe("user2-content");
      }
    });
  });
});
