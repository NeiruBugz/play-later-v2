import {
  cleanupDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import { createUser } from "@/test/setup/db-factories";
import { Prisma } from "@prisma/client";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

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
      // Arrange
      const user = await createUser({
        username: "originaluser",
        usernameNormalized: "originaluser",
      });

      // Act
      const updatedUser = await updateUserProfile(user.id, {
        username: "NewUsername",
        usernameNormalized: "newusername",
      });

      // Assert
      expect(updatedUser).toMatchObject({
        id: user.id,
        username: "NewUsername",
        usernameNormalized: "newusername",
      });

      // Verify database state
      const dbUser = await findUserById(user.id, {
        select: { id: true, username: true, usernameNormalized: true },
      });
      expect(dbUser?.username).toBe("NewUsername");
      expect(dbUser?.usernameNormalized).toBe("newusername");
    });

    it("should fail when updating username to existing username (different case)", async () => {
      // Arrange
      await createUser({
        username: "ExistingUser",
        usernameNormalized: "existinguser",
      });
      const user2 = await createUser({
        username: "AnotherUser",
        usernameNormalized: "anotheruser",
      });

      // Act & Assert
      await expect(
        updateUserProfile(user2.id, {
          username: "existinguser",
          usernameNormalized: "existinguser",
        })
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);

      // Verify error is a unique constraint violation
      try {
        await updateUserProfile(user2.id, {
          username: "existinguser",
          usernameNormalized: "existinguser",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          expect(error.code).toBe("P2002");
          expect(error.meta?.target).toContain("usernameNormalized");
        }
      }
    });

    it("should update user image", async () => {
      // Arrange
      const user = await createUser();

      // Act
      const updatedUser = await updateUserProfile(user.id, {
        image: "https://example.com/avatar.jpg",
      });

      // Assert
      expect(updatedUser).toMatchObject({
        id: user.id,
        image: "https://example.com/avatar.jpg",
      });

      // Verify database state
      const dbUser = await findUserById(user.id, {
        select: { id: true, image: true },
      });
      expect(dbUser?.image).toBe("https://example.com/avatar.jpg");
    });

    it("should update multiple fields at once", async () => {
      // Arrange
      const user = await createUser({
        username: "oldusername",
        usernameNormalized: "oldusername",
      });

      // Act
      const updatedUser = await updateUserProfile(user.id, {
        username: "NewUsername",
        usernameNormalized: "newusername",
        image: "https://example.com/new-avatar.jpg",
      });

      // Assert
      expect(updatedUser).toMatchObject({
        id: user.id,
        username: "NewUsername",
        usernameNormalized: "newusername",
        image: "https://example.com/new-avatar.jpg",
      });

      // Verify database state
      const dbUser = await findUserById(user.id, {
        select: {
          id: true,
          username: true,
          usernameNormalized: true,
          image: true,
        },
      });
      expect(dbUser).toMatchObject({
        id: user.id,
        username: "NewUsername",
        usernameNormalized: "newusername",
        image: "https://example.com/new-avatar.jpg",
      });
    });

    it("should throw error with non-existent user ID", async () => {
      // Arrange
      const nonExistentId = "clxxxxxxxxxxxxxxxxxxxxxxxx";

      // Act & Assert
      await expect(
        updateUserProfile(nonExistentId, {
          username: "newusername",
        })
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);

      try {
        await updateUserProfile(nonExistentId, {
          username: "newusername",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          expect(error.code).toBe("P2025");
        }
      }
    });

    it("should succeed with empty data object (no-op update)", async () => {
      // Arrange
      const user = await createUser({
        username: "testuser",
        usernameNormalized: "testuser",
        // image: "https://example.com/avatar.jpg",
      });

      // Act
      const updatedUser = await updateUserProfile(user.id, {});

      // Assert
      expect(updatedUser).toMatchObject({
        id: user.id,
        username: "testuser",
        usernameNormalized: "testuser",
        // image: "https://example.com/avatar.jpg",
      });

      // Verify database state remains unchanged
      const dbUser = await findUserById(user.id, {
        select: {
          id: true,
          username: true,
          usernameNormalized: true,
          image: true,
        },
      });
      expect(dbUser).toMatchObject({
        id: user.id,
        username: "testuser",
        usernameNormalized: "testuser",
        // image: "https://example.com/avatar.jpg",
      });
    });

    it("should handle updating username to null", async () => {
      // Arrange
      const user = await createUser({
        username: "testuser",
        usernameNormalized: "testuser",
      });

      // Act
      const updatedUser = await updateUserProfile(user.id, {
        username: null as unknown as string,
        usernameNormalized: null as unknown as string,
      });

      // Assert
      expect(updatedUser).toMatchObject({
        id: user.id,
        username: null,
        usernameNormalized: null,
      });

      // Verify database state
      const dbUser = await findUserById(user.id, {
        select: { id: true, username: true, usernameNormalized: true },
      });
      expect(dbUser?.username).toBeNull();
      expect(dbUser?.usernameNormalized).toBeNull();
    });

    it("should handle updating image to null", async () => {
      // Arrange
      const user = await createUser({
        // image: "https://example.com/avatar.jpg",
      });

      // Act
      const updatedUser = await updateUserProfile(user.id, {
        image: null as unknown as string,
      });

      // Assert
      expect(updatedUser).toMatchObject({
        id: user.id,
        image: null,
      });

      // Verify database state
      const dbUser = await findUserById(user.id, {
        select: { id: true, image: true },
      });
      expect(dbUser?.image).toBeNull();
    });

    it("should maintain other user fields when updating profile", async () => {
      // Arrange
      const user = await createUser({
        username: "testuser",
        usernameNormalized: "testuser",
        email: "test@example.com",
        name: "Test User",
        steamId64: "76561198012345678",
        steamUsername: "steamuser",
      });

      // Act
      const updatedUser = await updateUserProfile(user.id, {
        username: "newusername",
        usernameNormalized: "newusername",
      });

      // Assert - other fields should remain unchanged
      expect(updatedUser).toMatchObject({
        id: user.id,
        username: "newusername",
        usernameNormalized: "newusername",
        email: "test@example.com",
        name: "Test User",
        steamId64: "76561198012345678",
        steamUsername: "steamuser",
      });
    });

    it("should enforce unique constraint on username field", async () => {
      // Arrange
      await createUser({
        username: "uniqueuser",
        usernameNormalized: "uniqueuser",
      });
      const user2 = await createUser({
        username: "anotheruser",
        usernameNormalized: "anotheruser",
      });

      // Act & Assert - try to update to exact same username
      await expect(
        updateUserProfile(user2.id, {
          username: "uniqueuser",
          usernameNormalized: "uniqueuser",
        })
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);

      try {
        await updateUserProfile(user2.id, {
          username: "uniqueuser",
          usernameNormalized: "uniqueuser",
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          expect(error.code).toBe("P2002");
        }
      }
    });

    it("should allow updating username case without changing usernameNormalized", async () => {
      // Arrange
      const user = await createUser({
        username: "testuser",
        usernameNormalized: "testuser",
      });

      // Act - update only the case of username, keep normalized the same
      const updatedUser = await updateUserProfile(user.id, {
        username: "TestUser",
      });

      // Assert
      expect(updatedUser).toMatchObject({
        id: user.id,
        username: "TestUser",
        usernameNormalized: "testuser",
      });
    });

    it("should handle multiple sequential updates", async () => {
      // Arrange
      const user = await createUser({
        username: "user1",
        usernameNormalized: "user1",
      });

      // Act - multiple sequential updates
      const update1 = await updateUserProfile(user.id, {
        username: "user2",
        usernameNormalized: "user2",
      });
      expect(update1.username).toBe("user2");

      const update2 = await updateUserProfile(user.id, {
        image: "https://example.com/avatar1.jpg",
      });
      expect(update2.image).toBe("https://example.com/avatar1.jpg");
      expect(update2.username).toBe("user2");

      const update3 = await updateUserProfile(user.id, {
        username: "user3",
        usernameNormalized: "user3",
        image: "https://example.com/avatar2.jpg",
      });

      // Assert
      expect(update3).toMatchObject({
        id: user.id,
        username: "user3",
        usernameNormalized: "user3",
        image: "https://example.com/avatar2.jpg",
      });

      // Verify final database state
      const dbUser = await findUserById(user.id, {
        select: {
          id: true,
          username: true,
          usernameNormalized: true,
          image: true,
        },
      });
      expect(dbUser).toMatchObject({
        username: "user3",
        usernameNormalized: "user3",
        image: "https://example.com/avatar2.jpg",
      });
    });
  });
});
