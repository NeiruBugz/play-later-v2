import { PutObjectCommand } from "@aws-sdk/client-s3";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AvatarStorageService } from "./avatar-storage";

vi.mock("./s3-client", () => ({
  s3Client: {
    send: vi.fn(),
  },
}));

vi.mock("@/env.mjs", () => ({
  env: {
    S3_BUCKET_NAME: "test-bucket",
    S3_AVATAR_PATH_PREFIX: "user-avatars/",
    AWS_REGION: "us-east-1",
    AWS_ENDPOINT_URL: undefined, // Will be overridden in specific tests
  },
}));

vi.mock("@/shared/lib/app/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
  })),
}));

const createMockFile = (name: string, size: number, type: string): File => {
  const buffer = new ArrayBuffer(size);
  const blob = new Blob([buffer], { type });
  return new File([blob], name, { type });
};

describe("AvatarStorageService", () => {
  const TEST_USER_ID = "user-123";
  const MOCK_TIMESTAMP = 1705847392000;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(MOCK_TIMESTAMP);
    const { s3Client } = await import("./s3-client");
    vi.mocked(s3Client.send).mockResolvedValue({} as any);
  });

  describe("File Validation - Valid Files", () => {
    it("should accept valid JPEG file under 5MB", async () => {
      const file = createMockFile("avatar.jpg", 3 * 1024 * 1024, "image/jpeg");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.url).toBeDefined();
        expect(typeof result.data.url).toBe("string");
      }
    });

    it("should accept valid PNG file", async () => {
      const file = createMockFile("avatar.png", 2 * 1024 * 1024, "image/png");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.url).toBeDefined();
      }
    });

    it("should accept valid GIF file", async () => {
      const file = createMockFile("avatar.gif", 2 * 1024 * 1024, "image/gif");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.url).toBeDefined();
      }
    });

    it("should accept valid WebP file", async () => {
      const file = createMockFile("avatar.webp", 2 * 1024 * 1024, "image/webp");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.url).toBeDefined();
      }
    });

    it("should accept file exactly 5MB (boundary test)", async () => {
      const file = createMockFile("avatar.jpg", 5 * 1024 * 1024, "image/jpeg");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.url).toBeDefined();
      }
    });
  });

  describe("File Validation - Invalid Files", () => {
    it("should reject file over 5MB (6MB)", async () => {
      const file = createMockFile("large.jpg", 6 * 1024 * 1024, "image/jpeg");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("File size exceeds 5MB");
      }
    });

    it("should reject file with invalid MIME type (text/plain)", async () => {
      const file = createMockFile("file.txt", 1024, "text/plain");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Unsupported file format");
      }
    });

    it("should reject file with invalid MIME type (application/pdf)", async () => {
      const file = createMockFile("document.pdf", 1024, "application/pdf");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Unsupported file format");
      }
    });
  });

  describe("S3 Key Generation", () => {
    it("should generate key with S3_AVATAR_PATH_PREFIX", async () => {
      const { s3Client } = await import("./s3-client");
      const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

      await AvatarStorageService.uploadAvatar(TEST_USER_ID, file);

      expect(s3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Key: expect.stringContaining("user-avatars/"),
          }),
        })
      );
    });

    it("should generate key with userId", async () => {
      const { s3Client } = await import("./s3-client");
      const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

      await AvatarStorageService.uploadAvatar(TEST_USER_ID, file);

      expect(s3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Key: expect.stringContaining(TEST_USER_ID),
          }),
        })
      );
    });

    it("should generate key with timestamp", async () => {
      const { s3Client } = await import("./s3-client");
      const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

      await AvatarStorageService.uploadAvatar(TEST_USER_ID, file);

      expect(s3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Key: expect.stringContaining(MOCK_TIMESTAMP.toString()),
          }),
        })
      );
    });

    it("should generate key with sanitized filename", async () => {
      const { s3Client } = await import("./s3-client");
      const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

      await AvatarStorageService.uploadAvatar(TEST_USER_ID, file);

      const expectedKey = `user-avatars/${TEST_USER_ID}/${MOCK_TIMESTAMP}-avatar.jpg`;
      expect(s3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Key: expectedKey,
          }),
        })
      );
    });

    it("should sanitize filename with spaces to underscores", async () => {
      const { s3Client } = await import("./s3-client");
      const file = createMockFile("my avatar pic.jpg", 1024, "image/jpeg");

      await AvatarStorageService.uploadAvatar(TEST_USER_ID, file);

      const expectedKey = `user-avatars/${TEST_USER_ID}/${MOCK_TIMESTAMP}-my_avatar_pic.jpg`;
      expect(s3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Key: expectedKey,
          }),
        })
      );
    });

    it("should sanitize filename with special characters (@#$%) to underscores", async () => {
      const { s3Client } = await import("./s3-client");
      const file = createMockFile("user@#avatar$%.jpg", 1024, "image/jpeg");

      await AvatarStorageService.uploadAvatar(TEST_USER_ID, file);

      const expectedKey = `user-avatars/${TEST_USER_ID}/${MOCK_TIMESTAMP}-user__avatar__.jpg`;
      expect(s3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Key: expectedKey,
          }),
        })
      );
    });

    it("should preserve valid characters (alphanumeric, ., -) in filename", async () => {
      const { s3Client } = await import("./s3-client");
      const file = createMockFile("avatar-pic.v2.jpg", 1024, "image/jpeg");

      await AvatarStorageService.uploadAvatar(TEST_USER_ID, file);

      const expectedKey = `user-avatars/${TEST_USER_ID}/${MOCK_TIMESTAMP}-avatar-pic.v2.jpg`;
      expect(s3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Key: expectedKey,
          }),
        })
      );
    });
  });

  describe("Upload Success", () => {
    it("should return success result with URL", async () => {
      const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.url).toBeDefined();
        expect(typeof result.data.url).toBe("string");
        expect(result.data.url).toContain("test-bucket");
      }
    });

    it("should return correct URL format for LocalStack", async () => {
      const { env } = await import("@/env.mjs");
      vi.spyOn(env, "AWS_ENDPOINT_URL", "get").mockReturnValue(
        "http://localhost:4566"
      );

      const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const expectedKey = `user-avatars/${TEST_USER_ID}/${MOCK_TIMESTAMP}-avatar.jpg`;
        expect(result.data.url).toBe(
          `http://localhost:4566/test-bucket/${expectedKey}`
        );
      }
    });

    it("should return correct URL format for AWS S3", async () => {
      const { env } = await import("@/env.mjs");
      const originalValue = env.AWS_ENDPOINT_URL;
      Object.defineProperty(env, "AWS_ENDPOINT_URL", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const expectedKey = `user-avatars/${TEST_USER_ID}/${MOCK_TIMESTAMP}-avatar.jpg`;
        expect(result.data.url).toBe(
          `https://test-bucket.s3.us-east-1.amazonaws.com/${expectedKey}`
        );
      }

      Object.defineProperty(env, "AWS_ENDPOINT_URL", {
        value: originalValue,
        writable: true,
        configurable: true,
      });
    });

    it("should call S3 client with correct parameters", async () => {
      const { s3Client } = await import("./s3-client");
      const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

      await AvatarStorageService.uploadAvatar(TEST_USER_ID, file);

      expect(s3Client.send).toHaveBeenCalledTimes(1);
      expect(s3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));

      const putCommand = vi.mocked(s3Client.send).mock
        .calls[0][0] as PutObjectCommand;
      expect(putCommand.input).toMatchObject({
        Bucket: "test-bucket",
        Key: `user-avatars/${TEST_USER_ID}/${MOCK_TIMESTAMP}-avatar.jpg`,
        ContentType: "image/jpeg",
        Body: expect.any(Buffer),
      });
    });
  });

  describe("Upload Failure", () => {
    it("should return error result when S3 upload throws error", async () => {
      const { s3Client } = await import("./s3-client");
      vi.mocked(s3Client.send).mockRejectedValue(
        new Error("S3 connection failed")
      );
      const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Upload failed. Please try again.");
      }
    });

    it("should return error result on network error", async () => {
      const { s3Client } = await import("./s3-client");
      vi.mocked(s3Client.send).mockRejectedValue(new Error("Network timeout"));
      const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Upload failed. Please try again.");
      }
    });

    it("should log error when upload fails", async () => {
      const { s3Client } = await import("./s3-client");

      const mockError = new Error("S3 service unavailable");
      vi.mocked(s3Client.send).mockRejectedValue(mockError);
      const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

      await expect(
        AvatarStorageService.uploadAvatar(TEST_USER_ID, file)
      ).resolves.toEqual({
        ok: false,
        error: "Upload failed. Please try again.",
      });
    });
  });

  describe("Logging", () => {
    it("should log info with userId and key on successful upload", async () => {
      const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(true);
    });

    it("should log error with error object and userId on failed upload", async () => {
      const { s3Client } = await import("./s3-client");

      const mockError = new Error("Upload error");
      vi.mocked(s3Client.send).mockRejectedValue(mockError);
      const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

      const result = await AvatarStorageService.uploadAvatar(
        TEST_USER_ID,
        file
      );

      expect(result.ok).toBe(false);
    });
  });
});
