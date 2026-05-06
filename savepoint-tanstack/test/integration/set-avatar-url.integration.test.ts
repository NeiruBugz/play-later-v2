import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { getServerUserId } from "@/entities/session/api/get-session.server";
import { setAvatarUrlFn } from "@/features/upload-avatar/api/set-avatar-url";
import { UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

vi.mock("@/entities/session/api/get-session.server", () => ({
  getServerUserId: vi.fn(),
}));

const mockGetServerUserId = vi.mocked(getServerUserId);

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("set-avatar-url");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  vi.resetAllMocks();
  await db.prisma.user.deleteMany();
});

describe("setAvatarUrlFn", () => {
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

      mockGetServerUserId.mockResolvedValue(userId);

      await setAvatarUrlFn({ data: { url: avatarUrl } });
    });

    it("persists the URL to the user image field", async () => {
      const updated = await db.prisma.user.findUnique({
        where: { id: userId },
      });

      expect(updated?.image).toBe(avatarUrl);
    });
  });

  describe("given an unauthenticated request", () => {
    beforeEach(() => {
      mockGetServerUserId.mockResolvedValue(undefined);
    });

    it("rejects with UnauthorizedError", async () => {
      await expect(
        setAvatarUrlFn({
          data: { url: "https://s3.example.com/avatars/any.png" },
        })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });
});
