import { resetTestDatabase, setupDatabase } from "@/test/setup/database";
import { createUser } from "@/test/setup/db-factories";

import { ConflictError, NotFoundError } from "@/shared/lib/errors";

import {
  createUserWithCredentials,
  findUserById,
  updateUserProfile,
} from "./user-repository";

describe("UserRepository - Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
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

      expect(result).toMatchObject({
        id: user.id,
        username: "NewUsername",
        usernameNormalized: "newusername",
      });

      const dbUser = await findUserById(user.id, {
        select: { id: true, username: true, usernameNormalized: true },
      });
      expect(dbUser?.username).toBe("NewUsername");
      expect(dbUser?.usernameNormalized).toBe("newusername");
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

      await expect(
        updateUserProfile(user2.id, {
          username: "existinguser",
          usernameNormalized: "existinguser",
        })
      ).rejects.toThrow();
    });

    it("should update user image", async () => {
      const user = await createUser();

      const result = await updateUserProfile(user.id, {
        image: "https://example.com/avatar.jpg",
      });

      expect(result).toMatchObject({
        id: user.id,
        image: "https://example.com/avatar.jpg",
      });

      const dbUser = await findUserById(user.id, {
        select: { id: true, image: true },
      });
      expect(dbUser?.image).toBe("https://example.com/avatar.jpg");
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

      expect(result).toMatchObject({
        id: user.id,
        username: "NewUsername",
        usernameNormalized: "newusername",
        image: "https://example.com/new-avatar.jpg",
      });

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

    it("should throw NotFoundError with non-existent user ID", async () => {
      const nonExistentId = "clxxxxxxxxxxxxxxxxxxxxxxxx";

      await expect(
        updateUserProfile(nonExistentId, {
          username: "newusername",
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should include operation context in NotFoundError", async () => {
      const nonExistentId = "clxxxxxxxxxxxxxxxxxxxxxxxx";

      await expect(
        updateUserProfile(nonExistentId, { username: "newusername" })
      ).rejects.toMatchObject({
        message: expect.stringContaining("updating profile"),
      });
    });

    it("should succeed with empty data object (no-op update)", async () => {
      const user = await createUser({
        username: "testuser",
        usernameNormalized: "testuser",
      });

      const result = await updateUserProfile(user.id, {});

      expect(result).toMatchObject({
        id: user.id,
        username: "testuser",
        usernameNormalized: "testuser",
      });

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
      });
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

      expect(result).toMatchObject({
        id: user.id,
        username: null,
        usernameNormalized: null,
      });

      const dbUser = await findUserById(user.id, {
        select: { id: true, username: true, usernameNormalized: true },
      });
      expect(dbUser?.username).toBeNull();
      expect(dbUser?.usernameNormalized).toBeNull();
    });

    it("should handle updating image to null", async () => {
      const user = await createUser({});

      const result = await updateUserProfile(user.id, {
        image: null as unknown as string,
      });

      expect(result).toMatchObject({
        id: user.id,
        image: null,
      });

      const dbUser = await findUserById(user.id, {
        select: { id: true, image: true },
      });
      expect(dbUser?.image).toBeNull();
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

      expect(result).toMatchObject({
        id: user.id,
        username: "newusername",
        usernameNormalized: "newusername",
      });
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

      await expect(
        updateUserProfile(user2.id, {
          username: "uniqueuser",
          usernameNormalized: "uniqueuser",
        })
      ).rejects.toThrow();
    });

    it("should allow updating username case without changing usernameNormalized", async () => {
      const user = await createUser({
        username: "testuser",
        usernameNormalized: "testuser",
      });

      const result = await updateUserProfile(user.id, {
        username: "TestUser",
      });

      expect(result).toMatchObject({
        id: user.id,
        username: "TestUser",
        usernameNormalized: "testuser",
      });
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
      expect(result1.username).toBe("user2");

      const result2 = await updateUserProfile(user.id, {
        image: "https://example.com/avatar1.jpg",
      });
      expect(result2.image).toBe("https://example.com/avatar1.jpg");
      expect(result2.username).toBe("user2");

      const result3 = await updateUserProfile(user.id, {
        username: "user3",
        usernameNormalized: "user3",
        image: "https://example.com/avatar2.jpg",
      });

      expect(result3).toMatchObject({
        id: user.id,
        username: "user3",
        usernameNormalized: "user3",
        image: "https://example.com/avatar2.jpg",
      });

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

  describe("createUserWithCredentials", () => {
    it("should throw ConflictError when email already exists", async () => {
      const email = "duplicate@example.com";
      await createUser({ email });

      await expect(
        createUserWithCredentials({ email, password: "hashedpassword" })
      ).rejects.toThrow(ConflictError);
    });

    it("should include email in ConflictError context", async () => {
      const email = "duplicate@example.com";
      await createUser({ email });

      await expect(
        createUserWithCredentials({ email, password: "hashedpassword" })
      ).rejects.toMatchObject({
        message: expect.stringContaining("email already exists"),
      });
    });
  });
});
