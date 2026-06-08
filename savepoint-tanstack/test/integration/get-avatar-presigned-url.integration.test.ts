/**
 * Integration test for getAvatarPresignedUrl (Slice 6 — Avatar Upload).
 *
 * Presigning is a local SigV4 computation — `getSignedUrl` never opens a
 * network connection — so this suite needs no running S3. It exercises the
 * full presigned-URL path plus the validation-rejection branches against
 * static AWS credentials, which makes it deterministic in every environment
 * (local with or without LocalStack, and the Postgres-only PR-quality CI job).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { getServerUserId } from "@/entities/session/api/get-session.server";
// RED import — this module does not exist until the GREEN step.
import { getAvatarPresignedUrl } from "@/features/upload-avatar/api/get-avatar-presigned-url.server";
import { ValidationError } from "@/shared/lib/errors";

// ---------------------------------------------------------------------------
// Mock getServerUserId — the server fn resolves the caller via requireUserId()
// which internally calls getServerUserId(). We must supply it so the handler
// can authenticate the request.
// ---------------------------------------------------------------------------
vi.mock("@/entities/session/api/get-session.server", () => ({
  getServerUserId: vi.fn(),
}));

const mockGetServerUserId = vi.mocked(getServerUserId);

// ---------------------------------------------------------------------------
// Constants — mirrored exactly from savepoint-app/shared/lib/storage/avatar-storage.ts
// and savepoint-app/shared/constants (MAX_AVATAR_FILE_SIZE_BYTES).
// The new app enforces 10 MB (per spec §2.7 / tasks.md line 157), which is
// intentionally larger than the legacy 4 MB cap.
// ---------------------------------------------------------------------------
const MAX_AVATAR_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

const ONE_MB = 1 * 1024 * 1024;
const TEST_USER_ID = "avatar-presign-integration-user-001";

beforeAll(() => {
  mockGetServerUserId.mockResolvedValue(TEST_USER_ID);
});

afterAll(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("getAvatarPresignedUrl", () => {
  describe("given a valid image/png payload within the size limit", () => {
    it("returns an object with uploadUrl and publicUrl", async () => {
      const result = await getAvatarPresignedUrl({
        contentType: "image/png",
        contentLength: ONE_MB,
      });

      expect(result).toMatchObject({
        uploadUrl: expect.any(String),
        publicUrl: expect.any(String),
      });

      // uploadUrl must be a valid URL
      expect(() => new URL(result.uploadUrl)).not.toThrow();

      // uploadUrl must target the configured bucket
      expect(result.uploadUrl).toContain(
        process.env.S3_BUCKET_NAME ?? "savepoint-dev"
      );

      // LocalStack presigned URLs carry X-Amz-Signature (SigV4)
      const uploadUrlObj = new URL(result.uploadUrl);
      expect(
        uploadUrlObj.searchParams.has("X-Amz-Signature") ||
          uploadUrlObj.searchParams.has("Signature")
      ).toBe(true);

      // publicUrl must include the avatar path prefix
      expect(result.publicUrl).toContain(
        process.env.S3_AVATAR_PATH_PREFIX ?? "user-avatars/"
      );
    });
  });

  describe("given a contentLength that exceeds the 10 MB cap", () => {
    it("rejects with ValidationError", async () => {
      await expect(
        getAvatarPresignedUrl({
          contentType: "image/png",
          contentLength: MAX_AVATAR_SIZE_BYTES + 1,
        })
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe("given a disallowed MIME type", () => {
    it("rejects with ValidationError for application/pdf", async () => {
      await expect(
        getAvatarPresignedUrl({
          contentType: "application/pdf",
          contentLength: ONE_MB,
        })
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it("rejects with ValidationError for text/plain", async () => {
      await expect(
        getAvatarPresignedUrl({
          contentType: "text/plain",
          contentLength: ONE_MB,
        })
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe("given each member of the allowed MIME allow-list", () => {
    it.each(ALLOWED_MIME_TYPES)(
      "accepts %s without throwing",
      async (contentType) => {
        await expect(
          getAvatarPresignedUrl({ contentType, contentLength: ONE_MB })
        ).resolves.toMatchObject({ uploadUrl: expect.any(String) });
      }
    );
  });
});
