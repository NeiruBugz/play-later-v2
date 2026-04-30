import {
  createUserWithCredentials,
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
import { ConflictError } from "@/shared/lib/errors";

import { AuthService } from "./auth-service";

describe("AuthService", () => {
  let service: AuthService;
  let mockHashPassword: ReturnType<typeof vi.fn>;
  let mockFindUserByEmail: ReturnType<typeof vi.fn>;
  let mockCreateUserWithCredentials: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
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

      expect(result.user.email).toBe("newuser@example.com");

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

      expect(result.user).toEqual(createdUserFixture);
      expect(result.message).toBe("Account created successfully");

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

      expect(result.user.name).toBeNull();

      expect(mockCreateUserWithCredentials).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: givenHashedPassword,
        name: null,
      });
    });

    it("should throw ConflictError when user already exists", async () => {
      mockFindUserByEmail.mockResolvedValue(existingUserFixture);

      await expect(
        service.signUp(signUpInputForExistingUserFixture)
      ).rejects.toThrow(ConflictError);
      await expect(
        service.signUp(signUpInputForExistingUserFixture)
      ).rejects.toThrow("An account with this email already exists");

      expect(mockFindUserByEmail).toHaveBeenCalledWith("existing@example.com");
      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockCreateUserWithCredentials).not.toHaveBeenCalled();
    });

    it("should translate unique constraint violation to ConflictError", async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);

      mockCreateUserWithCredentials.mockRejectedValue(
        new Error("Unique constraint failed on the fields: (`email`)")
      );

      await expect(
        service.signUp(signUpInputForUniqueConstraintViolationFixture)
      ).rejects.toThrow(ConflictError);
    });

    it("should propagate password hashing errors", async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockHashPassword.mockRejectedValue(new Error("Hashing failed"));

      await expect(service.signUp(signUpInputFixture)).rejects.toThrow(
        "Hashing failed"
      );

      expect(mockCreateUserWithCredentials).not.toHaveBeenCalled();
    });

    it("should propagate database errors during user creation", async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockCreateUserWithCredentials.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(service.signUp(signUpInputFixture)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle case when database returns user with null email", async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(givenHashedPassword);
      mockCreateUserWithCredentials.mockResolvedValue(
        createdUserWithNullEmailFixture
      );

      const result = await service.signUp(signUpInputFixture);

      expect(result.user.id).toBe("user-123");
    });
  });
});
