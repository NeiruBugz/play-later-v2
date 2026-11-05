import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { setAvatarUrlWorker } from "@/features/upload-avatar/api/set-avatar-url.worker";
import {
  AVATAR_PATH_PREFIX,
  buildAvatarPublicUrl,
} from "@/shared/api/s3.server";
import { UnauthorizedError, ValidationError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// Integration tests call the worker directly with an explicit userId, rather
// than going through `setAvatarUrlFn` (which requires the TanStack Start
// server runtime under @tanstack/react-start@>=1.168). See
// savepoint-tanstack/CLAUDE.md foot-gun #8.

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("set-avatar-url");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.user.deleteMany();
});

const userId = "set-avatar-url-user-001";
const otherUserId = "set-avatar-url-user-002";
const ownKey = `${AVATAR_PATH_PREFIX}${userId}/0b1f.png`;

async function readImage() {
  const user = await db.prisma.user.findUnique({ where: { id: userId } });
  return user?.image;
}

describe("setAvatarUrlWorker", () => {
  beforeEach(async () => {
    await db.prisma.user.create({
      data: {
        id: userId,
        email: "set-avatar-url-happy@example.com",
        name: "Avatar Test User",
        emailVerified: true,
        username: "avatartestuser",
        usernameNormalized: "avatartestuser",
        image: null,
        isPublicProfile: false,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    });
  });

  describe("given a key under the user's own avatar prefix", () => {
    it("persists the canonical public URL built from the key", async () => {
      await setAvatarUrlWorker(userId, { key: ownKey });

      const image = await readImage();
      expect(image).toBe(buildAvatarPublicUrl(ownKey));
      expect(image).toContain(ownKey);
    });
  });

  describe("given a key under another user's prefix", () => {
    it("rejects with ValidationError and leaves the image untouched", async () => {
      await expect(
        setAvatarUrlWorker(userId, {
          key: `${AVATAR_PATH_PREFIX}${otherUserId}/0b1f.png`,
        })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(await readImage()).toBeNull();
    });
  });

  describe("given a key that climbs out of the user's prefix", () => {
    it("rejects with ValidationError", async () => {
      await expect(
        setAvatarUrlWorker(userId, {
          key: `${AVATAR_PATH_PREFIX}${userId}/../${otherUserId}/0b1f.png`,
        })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(await readImage()).toBeNull();
    });
  });

  describe("given a URL on a foreign host instead of a key", () => {
    it("rejects with ValidationError and persists nothing", async () => {
      await expect(
        setAvatarUrlWorker(userId, { url: "https://evil.example.net/a.png" })
      ).rejects.toThrow();
      await expect(
        setAvatarUrlWorker(userId, {
          key: "https://evil.example.net/a.png",
        })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(await readImage()).toBeNull();
    });
  });

  describe("given an unauthenticated request", () => {
    it("rejects with UnauthorizedError", async () => {
      await expect(
        setAvatarUrlWorker(undefined, { key: ownKey })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });
});
