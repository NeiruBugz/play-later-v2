import { prisma } from "@/shared/lib";
import * as passwordUtils from "@/shared/lib";

import { ServiceErrorCode } from "../types";
import { AuthService } from "./auth-service";

describe("AuthService", () => {
  let service: AuthService;
  let mockHashPassword: ReturnType<typeof vi.fn>;
  let mockPrismaFindUnique: ReturnType<typeof vi.fn>;
  let mockPrismaCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();
    mockHashPassword = vi.mocked(passwordUtils.hashPassword);
    mockPrismaFindUnique = vi.mocked(prisma.user.findUnique);
    mockPrismaCreate = vi.mocked(prisma.user.create);
  });

  describe("signUp", () => {
    it("should successfully create a new user with hashed password", async () => {
      const signUpInput = {
        email: "newuser@example.com",
        password: "securepassword123",
        name: "John Doe",
      };

      const hashedPassword = "$2a$10$hashedpassword";
      const createdUser = {
        id: "user-123",
        email: "newuser@example.com",
        name: "John Doe",
      };

      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(hashedPassword);
      mockPrismaCreate.mockResolvedValue(createdUser);

      const result = await service.signUp(signUpInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toEqual({
          id: "user-123",
          email: "newuser@example.com",
          name: "John Doe",
        });
        expect(result.data.message).toBe("Account created successfully");
      }

      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        where: { email: "newuser@example.com" },
      });
      expect(mockHashPassword).toHaveBeenCalledWith("securepassword123");
      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: {
          email: "newuser@example.com",
          password: hashedPassword,
          name: "John Doe",
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    });

    it("should create user without name when name is not provided", async () => {
      const signUpInput = {
        email: "newuser@example.com",
        password: "securepassword123",
      };

      const hashedPassword = "$2a$10$hashedpassword";
      const createdUser = {
        id: "user-123",
        email: "newuser@example.com",
        name: null,
      };

      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(hashedPassword);
      mockPrismaCreate.mockResolvedValue(createdUser);

      const result = await service.signUp(signUpInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.name).toBeNull();
      }

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: {
          email: "newuser@example.com",
          password: hashedPassword,
          name: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    });

    it("should return error when user already exists", async () => {
      const signUpInput = {
        email: "existing@example.com",
        password: "securepassword123",
        name: "John Doe",
      };

      const existingUser = {
        id: "user-456",
        email: "existing@example.com",
        name: "Existing User",
        emailVerified: null,
        image: null,
        password: "$2a$10$existinghashedpassword",
        username: null,
        steamProfileURL: null,
        steamId64: null,
        steamUsername: null,
        steamAvatar: null,
        steamConnectedAt: null,
      };

      mockPrismaFindUnique.mockResolvedValue(existingUser);

      const result = await service.signUp(signUpInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An account with this email already exists");
        expect(result.code).toBe(ServiceErrorCode.CONFLICT);
      }

      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        where: { email: "existing@example.com" },
      });
      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    it("should handle unique constraint violation from database", async () => {
      const signUpInput = {
        email: "newuser@example.com",
        password: "securepassword123",
        name: "John Doe",
      };

      const hashedPassword = "$2a$10$hashedpassword";

      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(hashedPassword);
      mockPrismaCreate.mockRejectedValue(
        new Error("Unique constraint failed on the fields: (`email`)")
      );

      const result = await service.signUp(signUpInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An account with this email already exists");
        expect(result.code).toBe(ServiceErrorCode.CONFLICT);
      }
    });

    it("should handle password hashing errors", async () => {
      const signUpInput = {
        email: "newuser@example.com",
        password: "securepassword123",
        name: "John Doe",
      };

      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockRejectedValue(new Error("Hashing failed"));

      const result = await service.signUp(signUpInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Hashing failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }

      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    it("should handle database errors during user creation", async () => {
      const signUpInput = {
        email: "newuser@example.com",
        password: "securepassword123",
        name: "John Doe",
      };

      const hashedPassword = "$2a$10$hashedpassword";

      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(hashedPassword);
      mockPrismaCreate.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.signUp(signUpInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("should handle case when database returns user with null email", async () => {
      const signUpInput = {
        email: "newuser@example.com",
        password: "securepassword123",
        name: "John Doe",
      };

      const hashedPassword = "$2a$10$hashedpassword";
      const createdUser = {
        id: "user-123",
        email: null, // Edge case: email is null
        name: "John Doe",
      };

      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(hashedPassword);
      mockPrismaCreate.mockResolvedValue(createdUser);

      const result = await service.signUp(signUpInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.id).toBe("user-123");
      }
    });
  });

  describe("signIn", () => {
    it("should return error indicating to use NextAuth", async () => {
      const signInInput = {
        email: "user@example.com",
        password: "password123",
      };

      const result = await service.signIn(signInInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Sign in should be handled through NextAuth");
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
      }
    });

    it("should not call any external dependencies", async () => {
      const signInInput = {
        email: "user@example.com",
        password: "password123",
      };

      await service.signIn(signInInput);

      expect(mockPrismaFindUnique).not.toHaveBeenCalled();
      expect(mockHashPassword).not.toHaveBeenCalled();
    });
  });
});
