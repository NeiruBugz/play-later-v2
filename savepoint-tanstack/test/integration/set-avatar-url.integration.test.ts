import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { setAvatarUrlWorker } from "@/features/upload-avatar/api/set-avatar-url.worker";
import { UnauthorizedError } from "@/shared/lib/errors";

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

describe("setAvatarUrlWorker", () => {
  describe("given an authenticated user and a valid public URL", () => {
    const userId = "set-avatar-url-user-001";
    const avatarUrl =
      "https://s3.example.com/avatars/set-avatar-url-user-001.png";

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

      await setAvatarUrlWorker(userId, { url: avatarUrl });
    });

    it("persists the URL to the user image field", async () => {
      const updated = await db.prisma.user.findUnique({
        where: { id: userId },
      });

      expect(updated?.image).toBe(avatarUrl);
    });
  });

  describe("given an unauthenticated request", () => {
    it("rejects with UnauthorizedError", async () => {
      await expect(
        setAvatarUrlWorker(undefined, {
          url: "https://s3.example.com/avatars/any.png",
        })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });
});
