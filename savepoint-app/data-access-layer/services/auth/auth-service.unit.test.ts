import {
  createUserWithCredentials,
  DuplicateError,
  findUserByEmail,
} from "@/data-access-layer/repository";
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
      mockFindUserByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockCreateUserWithCredentials.mockResolvedValue(createdUserFixture);

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
      mockFindUserByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockCreateUserWithCredentials.mockResolvedValue(createdUserFixture);

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
      mockFindUserByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockCreateUserWithCredentials.mockResolvedValue(
        createdUserWithoutNameFixture
      );

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
      mockFindUserByEmail.mockResolvedValue(existingUserFixture);

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
      mockFindUserByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);

      mockCreateUserWithCredentials.mockRejectedValue(
        new DuplicateError("Unique constraint failed on the fields: (`email`)")
      );

      const result = await service.signUp(
        signUpInputForUniqueConstraintViolationFixture
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An account with this email already exists");
        expect(result.code).toBe(ServiceErrorCode.CONFLICT);
      }
    });

    it("should handle password hashing errors", async () => {
      mockFindUserByEmail.mockResolvedValue(null);
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
      mockFindUserByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockCreateUserWithCredentials.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.signUp(signUpInputFixture);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("should handle case when database returns user with null email", async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockCreateUserWithCredentials.mockResolvedValue(
        createdUserWithNullEmailFixture
      );

      const result = await service.signUp(signUpInputFixture);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.id).toBe("user-123");
      }
    });
  });
});
