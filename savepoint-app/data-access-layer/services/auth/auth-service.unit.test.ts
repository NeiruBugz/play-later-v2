import {
  createdUserFixture,
  createdUserWithNullEmailFixture,
  createdUserWithoutNameFixture,
  existingUserFixture,
  signUpInputFixture,
  signUpInputForExistingUserFixture,
  signUpInputForUniqueConstraintViolationFixture,
  signUpInputWithoutNameFixture,
} from "@fixtures/service/auth";
import { Prisma } from "@prisma/client";

import {
  createUserWithCredentials,
  findUserByEmail,
} from "@/data-access-layer/repository";
import { repositorySuccess, repositoryError, RepositoryErrorCode } from "@/data-access-layer/repository/types";
import { hashPassword } from "@/shared/lib";

import { ServiceErrorCode } from "../types";
import { AuthService } from "./auth-service";

describe("AuthService", () => {
  let service: AuthService;
  let mockHashPassword: ReturnType<typeof vi.fn>;
  let mockFindUserByEmail: ReturnType<typeof vi.fn>;
  let mockCreateUserWithCredentials: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();
    mockHashPassword = vi.mocked(hashPassword);
    mockFindUserByEmail = vi.mocked(findUserByEmail);
    mockCreateUserWithCredentials = vi.mocked(createUserWithCredentials);
  });

  describe("signUp", () => {
    const givenHashedPassword = "$2a$10$hashedpassword";
    it("should normalize email casing before lookup and creation", async () => {
      mockFindUserByEmail.mockResolvedValue(repositorySuccess(null));
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockCreateUserWithCredentials.mockResolvedValue(repositorySuccess(createdUserFixture));

      const result = await service.signUp(signUpInputFixture);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.email).toBe("newuser@example.com");
      }

      expect(mockFindUserByEmail).toHaveBeenCalledWith("newuser@example.com");
      expect(mockCreateUserWithCredentials).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: givenHashedPassword,
        name: "John Doe",
      });
    });

    it("should successfully create a new user with hashed password", async () => {
      mockFindUserByEmail.mockResolvedValue(repositorySuccess(null));
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockCreateUserWithCredentials.mockResolvedValue(repositorySuccess(createdUserFixture));

      const result = await service.signUp(signUpInputFixture);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toEqual(createdUserFixture);
        expect(result.data.message).toBe("Account created successfully");
      }

      expect(mockFindUserByEmail).toHaveBeenCalledWith("newuser@example.com");
      expect(mockHashPassword).toHaveBeenCalledWith("securepassword123");
      expect(mockCreateUserWithCredentials).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: givenHashedPassword,
        name: "John Doe",
      });
    });

    it("should create user without name when name is not provided", async () => {
      mockFindUserByEmail.mockResolvedValue(repositorySuccess(null));
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockCreateUserWithCredentials.mockResolvedValue(repositorySuccess(createdUserWithoutNameFixture));

      const result = await service.signUp(signUpInputWithoutNameFixture);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.name).toBeNull();
      }

      expect(mockCreateUserWithCredentials).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: givenHashedPassword,
        name: null,
      });
    });

    it("should return error when user already exists", async () => {
      mockFindUserByEmail.mockResolvedValue(repositorySuccess(existingUserFixture));

      const result = await service.signUp(signUpInputForExistingUserFixture);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An account with this email already exists");
        expect(result.code).toBe(ServiceErrorCode.CONFLICT);
      }

      expect(mockFindUserByEmail).toHaveBeenCalledWith("existing@example.com");
      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockCreateUserWithCredentials).not.toHaveBeenCalled();
    });

    it("should handle unique constraint violation from database", async () => {
      mockFindUserByEmail.mockResolvedValue(repositorySuccess(null));
      mockHashPassword.mockResolvedValue(givenHashedPassword);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`email`)",
        {
          code: "P2002",
          clientVersion: "5.0.0",
        }
      );
      mockCreateUserWithCredentials.mockResolvedValue(
        repositoryError(RepositoryErrorCode.DUPLICATE, prismaError.message)
      );

      const result = await service.signUp(
        signUpInputForUniqueConstraintViolationFixture
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Unique constraint");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("should handle password hashing errors", async () => {
      mockFindUserByEmail.mockResolvedValue(repositorySuccess(null));
      mockHashPassword.mockRejectedValue(new Error("Hashing failed"));

      const result = await service.signUp(signUpInputFixture);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Hashing failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }

      expect(mockCreateUserWithCredentials).not.toHaveBeenCalled();
    });

    it("should handle database errors during user creation", async () => {
      mockFindUserByEmail.mockResolvedValue(repositorySuccess(null));
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockCreateUserWithCredentials.mockResolvedValue(
        repositoryError(RepositoryErrorCode.DATABASE_ERROR, "Database connection failed")
      );

      const result = await service.signUp(signUpInputFixture);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("should handle case when database returns user with null email", async () => {
      mockFindUserByEmail.mockResolvedValue(repositorySuccess(null));
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockCreateUserWithCredentials.mockResolvedValue(repositorySuccess(createdUserWithNullEmailFixture));

      const result = await service.signUp(signUpInputFixture);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.id).toBe("user-123");
      }
    });
  });
});
