import {
  createdUserFixture,
  createdUserWithNullEmailFixture,
  createdUserWithoutNameFixture,
  existingUserFixture,
  signInInputFixture,
  signUpInputFixture,
  signUpInputForExistingUserFixture,
  signUpInputForUniqueConstraintViolationFixture,
  signUpInputWithoutNameFixture,
} from "@fixtures/service/auth";
import { Prisma } from "@prisma/client";

import { hashPassword, prisma } from "@/shared/lib";

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
    mockHashPassword = vi.mocked(hashPassword);
    mockPrismaFindUnique = vi.mocked(prisma.user.findUnique);
    mockPrismaCreate = vi.mocked(prisma.user.create);
  });

  describe("signUp", () => {
    const givenHashedPassword = "$2a$10$hashedpassword";
    it("should normalize email casing before lookup and creation", async () => {
      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockPrismaCreate.mockResolvedValue(createdUserFixture);

      const result = await service.signUp(signUpInputFixture);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.email).toBe("newuser@example.com");
      }

      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        select: { id: true },
        where: { email: "newuser@example.com" },
      });
      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: {
          email: "newuser@example.com",
          password: givenHashedPassword,
          name: "John Doe",
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    });

    it("should successfully create a new user with hashed password", async () => {
      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockPrismaCreate.mockResolvedValue(createdUserFixture);

      const result = await service.signUp(signUpInputFixture);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toEqual(createdUserFixture);
        expect(result.data.message).toBe("Account created successfully");
      }

      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        select: { id: true },
        where: { email: "newuser@example.com" },
      });
      expect(mockHashPassword).toHaveBeenCalledWith("securepassword123");
      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: {
          email: "newuser@example.com",
          password: givenHashedPassword,
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
      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockPrismaCreate.mockResolvedValue(createdUserWithoutNameFixture);

      const result = await service.signUp(signUpInputWithoutNameFixture);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.name).toBeNull();
      }

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: {
          email: "newuser@example.com",
          password: givenHashedPassword,
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
      mockPrismaFindUnique.mockResolvedValue(existingUserFixture);

      const result = await service.signUp(signUpInputForExistingUserFixture);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An account with this email already exists");
        expect(result.code).toBe(ServiceErrorCode.CONFLICT);
      }

      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        select: { id: true },
        where: { email: "existing@example.com" },
      });
      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    it("should handle unique constraint violation from database", async () => {
      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      // Simulate Prisma P2002 error (unique constraint violation)
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`email`)",
        {
          code: "P2002",
          clientVersion: "5.0.0",
        }
      );
      mockPrismaCreate.mockRejectedValue(prismaError);

      const result = await service.signUp(
        signUpInputForUniqueConstraintViolationFixture
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User with this email already exists");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("should handle password hashing errors", async () => {
      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockRejectedValue(new Error("Hashing failed"));

      const result = await service.signUp(signUpInputFixture);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Hashing failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }

      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    it("should handle database errors during user creation", async () => {
      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockPrismaCreate.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.signUp(signUpInputFixture);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "Failed to create user: Database connection failed"
        );
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("should handle case when database returns user with null email", async () => {
      mockPrismaFindUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockPrismaCreate.mockResolvedValue(createdUserWithNullEmailFixture);

      const result = await service.signUp(signUpInputFixture);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.id).toBe("user-123");
      }
    });
  });

  describe("signIn", () => {
    it("should return error indicating to use NextAuth", async () => {
      const result = await service.signIn(signInInputFixture);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Sign in should be handled through NextAuth");
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
      }
    });

    it("should not call any external dependencies", async () => {
      await service.signIn(signInInputFixture);

      expect(mockPrismaFindUnique).not.toHaveBeenCalled();
      expect(mockHashPassword).not.toHaveBeenCalled();
    });
  });
});
