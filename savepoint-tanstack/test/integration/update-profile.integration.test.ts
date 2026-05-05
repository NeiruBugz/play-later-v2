import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ZodError } from "zod";

import { getServerUserId } from "@/entities/session/api/get-session.server";
import { updateProfileFn } from "@/features/edit-profile/api/update-profile";
import { ConflictError, UnauthorizedError } from "@/shared/lib/errors";

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
  db = await setupIsolatedDatabase("update-profile");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  vi.resetAllMocks();
  await db.prisma.user.deleteMany();
});

describe("updateProfileFn", () => {
  describe("given an authenticated user with a valid update payload", () => {
    const userId = "update-profile-user-001";

    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: userId,
          email: "update-profile-happy@example.com",
          name: "Original Name",
          emailVerified: true,
          username: "originaluser",
          usernameNormalized: "originaluser",
          image: null,
          isPublicProfile: false,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });

      mockGetServerUserId.mockResolvedValue(userId);

      await updateProfileFn({
        data: {
          username: "newuser",
          isPublicProfile: true,
        },
      });
    });

    it("persists the new fields on the user record", async () => {
      const updated = await db.prisma.user.findUnique({
        where: { id: userId },
      });

      expect(updated?.username).toBe("newuser");
      expect(updated?.isPublicProfile).toBe(true);
    });
  });

  describe("given an authenticated user submitting invalid input", () => {
    const userId = "update-profile-user-002";

    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: userId,
          email: "update-profile-invalid@example.com",
          name: "Validation Test User",
          emailVerified: true,
          username: "validationuser",
          usernameNormalized: "validationuser",
          image: null,
          isPublicProfile: false,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });

      mockGetServerUserId.mockResolvedValue(userId);
    });

    it("rejects with ZodError when username is too short", async () => {
      await expect(
        updateProfileFn({ data: { username: "ab" } })
      ).rejects.toBeInstanceOf(ZodError);
    });

    it("rejects with ZodError when username is empty", async () => {
      await expect(
        updateProfileFn({ data: { username: "" } })
      ).rejects.toBeInstanceOf(ZodError);
    });
  });

  describe("given a username that another user already has", () => {
    const userAId = "update-profile-user-003";
    const userBId = "update-profile-user-004";

    beforeEach(async () => {
      await db.prisma.user.createMany({
        data: [
          {
            id: userAId,
            email: "update-profile-user-a@example.com",
            name: "User A",
            emailVerified: true,
            username: "useraname",
            usernameNormalized: "useraname",
            image: null,
            isPublicProfile: false,
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
            updatedAt: new Date("2024-01-01T00:00:00.000Z"),
          },
          {
            id: userBId,
            email: "update-profile-user-b@example.com",
            name: "User B",
            emailVerified: true,
            username: "userbname",
            usernameNormalized: "userbname",
            image: null,
            isPublicProfile: false,
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
            updatedAt: new Date("2024-01-01T00:00:00.000Z"),
          },
        ],
      });

      mockGetServerUserId.mockResolvedValue(userAId);
    });

    it("rejects with ConflictError", async () => {
      await expect(
        updateProfileFn({ data: { username: "userbname" } })
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("given an unauthenticated request", () => {
    beforeEach(() => {
      mockGetServerUserId.mockResolvedValue(undefined);
    });

    it("rejects with UnauthorizedError", async () => {
      await expect(
        updateProfileFn({ data: { username: "anyusername" } })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });
});
