import {
  cleanupDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import { createUser } from "@/test/setup/db-factories";

import { checkUsernameAvailability } from "./check-username-availability";

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

describe("checkUsernameAvailability server action", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    try {
      await cleanupDatabase();
    } catch (error) {
      console.error("Error in global teardown:", error);
    }
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe("successful availability checks", () => {
    it("should return available: true when username is not taken", async () => {
      const result = await checkUsernameAvailability({
        username: "newuser123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.available).toBe(true);
      }
    });

    it("should return available: false when username is already taken", async () => {
      await createUser({
        username: "existinguser",
      });

      const result = await checkUsernameAvailability({
        username: "existinguser",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.available).toBe(false);
      }
    });

    it("should check username case-insensitively", async () => {
      await createUser({
        username: "testuser",
      });

      const result = await checkUsernameAvailability({
        username: "TestUser",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.available).toBe(false);
      }
    });

    it("should handle multiple users and only check exact username match", async () => {
      await createUser({
        username: "user1",
      });
      await createUser({
        username: "user2",
      });
      await createUser({
        username: "user3",
      });

      // Check for a username that doesn't exist
      const result = await checkUsernameAvailability({
        username: "user4",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.available).toBe(true);
      }
    });
  });

  describe("validation errors", () => {
    it("should reject username that is too short (< 3 chars)", async () => {
      const result = await checkUsernameAvailability({
        username: "ab",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("3");
      }
    });

    it("should reject username that is too long (> 25 chars)", async () => {
      const result = await checkUsernameAvailability({
        username: "a".repeat(26),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("25");
      }
    });

    it("should reject empty username", async () => {
      const result = await checkUsernameAvailability({
        username: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should reject reserved usernames", async () => {
      const result = await checkUsernameAvailability({
        username: "Admin",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Username is not allowed");
      }
    });

    it("should reject profane usernames", async () => {
      const result = await checkUsernameAvailability({
        username: "damnUser",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Username is not allowed");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle username with numbers", async () => {
      const result = await checkUsernameAvailability({
        username: "user123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.available).toBe(true);
      }
    });

    it("should handle username at exact minimum length (3 chars)", async () => {
      const result = await checkUsernameAvailability({
        username: "joe",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.available).toBe(true);
      }
    });

    it("should handle username at exact maximum length (25 chars)", async () => {
      const result = await checkUsernameAvailability({
        username: "verylongusernameTwentyFiv",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.available).toBe(true);
      }
    });
  });
});
