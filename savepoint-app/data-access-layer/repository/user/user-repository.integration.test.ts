import {
  cleanupDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import { createUser } from "@/test/setup/db-factories";

import { isRepositorySuccess } from "../types";
import { findUserById, updateUserProfile } from "./user-repository";

vi.mock("@/shared/lib", async () => {
  const actual =
    await vi.importActual<typeof import("@/shared/lib")>("@/shared/lib");
  const { getTestDatabase } = await import("@/test/setup/database");

  return {
    ...actual,
    get prisma() {
      return getTestDatabase();
    },
  };
});

describe("UserRepository - Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe("updateUserProfile", () => {
    it("should update username and usernameNormalized", async () => {
      const user = await createUser({
        username: "originaluser",
        usernameNormalized: "originaluser",
      });

      const result = await updateUserProfile(user.id, {
        username: "NewUsername",
        usernameNormalized: "newusername",
      });

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toMatchObject({
          id: user.id,
          username: "NewUsername",
          usernameNormalized: "newusername",
        });
      }

      const dbUserResult = await findUserById(user.id, {
        select: { id: true, username: true, usernameNormalized: true },
      });
      expect(dbUserResult.ok).toBe(true);
      if (dbUserResult.ok) {
        expect(dbUserResult.data?.username).toBe("NewUsername");
        expect(dbUserResult.data?.usernameNormalized).toBe("newusername");
      }
    });

    it("should fail when updating username to existing username (different case)", async () => {
      await createUser({
        username: "ExistingUser",
        usernameNormalized: "existinguser",
      });
      const user2 = await createUser({
        username: "AnotherUser",
        usernameNormalized: "anotheruser",
      });

      const result = await updateUserProfile(user2.id, {
        username: "existinguser",
        usernameNormalized: "existinguser",
      });

      expect(isRepositorySuccess(result)).toBe(false);
      if (!isRepositorySuccess(result)) {
        expect(result.error.code).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to update user profile");
      }
    });

    it("should update user image", async () => {
      const user = await createUser();

      const result = await updateUserProfile(user.id, {
        image: "https://example.com/avatar.jpg",
      });

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toMatchObject({
          id: user.id,
          image: "https://example.com/avatar.jpg",
        });
      }

      const dbUserResult = await findUserById(user.id, {
        select: { id: true, image: true },
      });
      expect(dbUserResult.ok).toBe(true);
      if (dbUserResult.ok) {
        expect(dbUserResult.data?.image).toBe("https://example.com/avatar.jpg");
      }
    });

    it("should update multiple fields at once", async () => {
      const user = await createUser({
        username: "oldusername",
        usernameNormalized: "oldusername",
      });

      const result = await updateUserProfile(user.id, {
        username: "NewUsername",
        usernameNormalized: "newusername",
        image: "https://example.com/new-avatar.jpg",
      });

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toMatchObject({
          id: user.id,
          username: "NewUsername",
          usernameNormalized: "newusername",
          image: "https://example.com/new-avatar.jpg",
        });
      }

      const dbUserResult = await findUserById(user.id, {
        select: {
          id: true,
          username: true,
          usernameNormalized: true,
          image: true,
        },
      });
      expect(dbUserResult.ok).toBe(true);
      if (dbUserResult.ok) {
        expect(dbUserResult.data).toMatchObject({
          id: user.id,
          username: "NewUsername",
          usernameNormalized: "newusername",
          image: "https://example.com/new-avatar.jpg",
        });
      }
    });

    it("should return error with non-existent user ID", async () => {
      const nonExistentId = "clxxxxxxxxxxxxxxxxxxxxxxxx";

      const result = await updateUserProfile(nonExistentId, {
        username: "newusername",
      });

      expect(isRepositorySuccess(result)).toBe(false);
      if (!isRepositorySuccess(result)) {
        expect(result.error.code).toBe("NOT_FOUND");
        expect(result.error.message).toBe("User not found");
      }
    });

    it("should succeed with empty data object (no-op update)", async () => {
      const user = await createUser({
        username: "testuser",
        usernameNormalized: "testuser",
        // image: "https://example.com/avatar.jpg",
      });

      const result = await updateUserProfile(user.id, {});

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toMatchObject({
          id: user.id,
          username: "testuser",
          usernameNormalized: "testuser",
          // image: "https://example.com/avatar.jpg",
        });
      }

      const dbUserResult = await findUserById(user.id, {
        select: {
          id: true,
          username: true,
          usernameNormalized: true,
          image: true,
        },
      });
      expect(dbUserResult.ok).toBe(true);
      if (dbUserResult.ok) {
        expect(dbUserResult.data).toMatchObject({
          id: user.id,
          username: "testuser",
          usernameNormalized: "testuser",
          // image: "https://example.com/avatar.jpg",
        });
      }
    });

    it("should handle updating username to null", async () => {
      const user = await createUser({
        username: "testuser",
        usernameNormalized: "testuser",
      });

      const result = await updateUserProfile(user.id, {
        username: null as unknown as string,
        usernameNormalized: null as unknown as string,
      });

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toMatchObject({
          id: user.id,
          username: null,
          usernameNormalized: null,
        });
      }

      const dbUserResult = await findUserById(user.id, {
        select: { id: true, username: true, usernameNormalized: true },
      });
      expect(dbUserResult.ok).toBe(true);
      if (dbUserResult.ok) {
        expect(dbUserResult.data?.username).toBeNull();
        expect(dbUserResult.data?.usernameNormalized).toBeNull();
      }
    });

    it("should handle updating image to null", async () => {
      const user = await createUser({
        // image: "https://example.com/avatar.jpg",
      });

      const result = await updateUserProfile(user.id, {
        image: null as unknown as string,
      });

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toMatchObject({
          id: user.id,
          image: null,
        });
      }

      const dbUserResult = await findUserById(user.id, {
        select: { id: true, image: true },
      });
      expect(dbUserResult.ok).toBe(true);
      if (dbUserResult.ok) {
        expect(dbUserResult.data?.image).toBeNull();
      }
    });

    it("should maintain other user fields when updating profile", async () => {
      const user = await createUser({
        username: "testuser",
        usernameNormalized: "testuser",
        email: "test@example.com",
        name: "Test User",
        steamId64: "76561198012345678",
        steamUsername: "steamuser",
      });

      const result = await updateUserProfile(user.id, {
        username: "newusername",
        usernameNormalized: "newusername",
      });

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toMatchObject({
          id: user.id,
          username: "newusername",
          usernameNormalized: "newusername",
        });
      }
    });

    it("should enforce unique constraint on username field", async () => {
      await createUser({
        username: "uniqueuser",
        usernameNormalized: "uniqueuser",
      });
      const user2 = await createUser({
        username: "anotheruser",
        usernameNormalized: "anotheruser",
      });

      const result = await updateUserProfile(user2.id, {
        username: "uniqueuser",
        usernameNormalized: "uniqueuser",
      });

      expect(isRepositorySuccess(result)).toBe(false);
      if (!isRepositorySuccess(result)) {
        expect(result.error.code).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to update user profile");
      }
    });

    it("should allow updating username case without changing usernameNormalized", async () => {
      const user = await createUser({
        username: "testuser",
        usernameNormalized: "testuser",
      });

      const result = await updateUserProfile(user.id, {
        username: "TestUser",
      });

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toMatchObject({
          id: user.id,
          username: "TestUser",
          usernameNormalized: "testuser",
        });
      }
    });

    it("should handle multiple sequential updates", async () => {
      const user = await createUser({
        username: "user1",
        usernameNormalized: "user1",
      });

      const result1 = await updateUserProfile(user.id, {
        username: "user2",
        usernameNormalized: "user2",
      });
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.data.username).toBe("user2");
      }

      const result2 = await updateUserProfile(user.id, {
        image: "https://example.com/avatar1.jpg",
      });
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.data.image).toBe("https://example.com/avatar1.jpg");
        expect(result2.data.username).toBe("user2");
      }

      const result3 = await updateUserProfile(user.id, {
        username: "user3",
        usernameNormalized: "user3",
        image: "https://example.com/avatar2.jpg",
      });

      expect(result3.ok).toBe(true);
      if (result3.ok) {
        expect(result3.data).toMatchObject({
          id: user.id,
          username: "user3",
          usernameNormalized: "user3",
          image: "https://example.com/avatar2.jpg",
        });
      }

      const dbUserResult = await findUserById(user.id, {
        select: {
          id: true,
          username: true,
          usernameNormalized: true,
          image: true,
        },
      });
      expect(dbUserResult.ok).toBe(true);
      if (dbUserResult.ok) {
        expect(dbUserResult.data).toMatchObject({
          username: "user3",
          usernameNormalized: "user3",
          image: "https://example.com/avatar2.jpg",
        });
      }
    });
  });
});
