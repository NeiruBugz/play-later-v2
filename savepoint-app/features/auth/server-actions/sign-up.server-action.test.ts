import * as authModule from "@/auth";
import { AuthService } from "@/data-access-layer/services";

import { ConflictError } from "@/shared/lib/errors";

import { signUpAction } from "./sign-up";

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}));

vi.mock("@/data-access-layer/services", () => ({
  AuthService: vi.fn(),
}));

describe("signUpAction", () => {
  let mockAuthService: {
    signUp: ReturnType<typeof vi.fn>;
  };
  let mockSignIn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockAuthService = {
      signUp: vi.fn(),
    };

    vi.mocked(AuthService).mockImplementation(function () {
      return mockAuthService as unknown as AuthService;
    });

    mockSignIn = vi.mocked(authModule.signIn);
  });

  it("should successfully sign up a user and auto sign in", async () => {
    const signUpData = {
      email: "newuser@example.com",
      password: "securepassword123",
      name: "John Doe",
    };

    mockAuthService.signUp.mockResolvedValue({
      user: {
        id: "user-123",
        email: "newuser@example.com",
        name: "John Doe",
      },
      message: "Account created successfully",
    });

    mockSignIn.mockResolvedValue(undefined);

    const result = await signUpAction(signUpData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message).toBe("Account created successfully");
    }

    expect(mockAuthService.signUp).toHaveBeenCalledWith(signUpData);
    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "newuser@example.com",
      password: "securepassword123",
      redirectTo: "/dashboard",
    });
  });

  it("should sign up without name when name is not provided", async () => {
    const signUpData = {
      email: "newuser@example.com",
      password: "securepassword123",
    };

    mockAuthService.signUp.mockResolvedValue({
      user: {
        id: "user-123",
        email: "newuser@example.com",
        name: null,
      },
      message: "Account created successfully",
    });

    mockSignIn.mockResolvedValue(undefined);

    const result = await signUpAction(signUpData);

    expect(result.success).toBe(true);
    expect(mockAuthService.signUp).toHaveBeenCalledWith({
      email: "newuser@example.com",
      password: "securepassword123",
    });
  });

  it("should surface ConflictError message when user already exists", async () => {
    const signUpData = {
      email: "existing@example.com",
      password: "securepassword123",
      name: "John Doe",
    };

    mockAuthService.signUp.mockRejectedValue(
      new ConflictError("An account with this email already exists")
    );

    const result = await signUpAction(signUpData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("An account with this email already exists");
    }

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should return validation error for invalid email", async () => {
    const signUpData = {
      email: "invalid-email",
      password: "securepassword123",
      name: "John Doe",
    };

    const result = await signUpAction(signUpData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("email");
    }

    expect(mockAuthService.signUp).not.toHaveBeenCalled();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should return validation error for short password", async () => {
    const signUpData = {
      email: "user@example.com",
      password: "short",
      name: "John Doe",
    };

    const result = await signUpAction(signUpData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("8 characters");
    }

    expect(mockAuthService.signUp).not.toHaveBeenCalled();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should surface raw error message when service throws an unexpected error", async () => {
    const signUpData = {
      email: "user@example.com",
      password: "securepassword123",
      name: "John Doe",
    };

    mockAuthService.signUp.mockRejectedValue(
      new Error("Database connection failed")
    );

    const result = await signUpAction(signUpData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Database connection failed");
    }

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should fall back to generic message when thrown value is not an Error", async () => {
    const signUpData = {
      email: "user@example.com",
      password: "securepassword123",
      name: "John Doe",
    };

    mockAuthService.signUp.mockRejectedValue("string-not-error");

    const result = await signUpAction(signUpData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("An unexpected error occurred");
    }
  });

  it("should validate email format strictly", async () => {
    const invalidEmails = [
      "notanemail",
      "@example.com",
      "user@",
      "user @example.com",
      "user@example",
    ];

    for (const email of invalidEmails) {
      const result = await signUpAction({
        email,
        password: "securepassword123",
        name: "Test User",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/email|validation/i);
      }
    }

    expect(mockAuthService.signUp).not.toHaveBeenCalled();
  });

  it("should accept valid emails", async () => {
    const validEmails = [
      "user@example.com",
      "user.name@example.com",
      "user+tag@example.co.uk",
      "user123@test-domain.com",
    ];

    mockAuthService.signUp.mockResolvedValue({
      user: {
        id: "user-123",
        email: "test@example.com",
        name: "Test",
      },
      message: "Account created successfully",
    });

    mockSignIn.mockResolvedValue(undefined);

    for (const email of validEmails) {
      vi.clearAllMocks();
      vi.mocked(AuthService).mockImplementation(function () {
        return mockAuthService as unknown as AuthService;
      });

      const result = await signUpAction({
        email,
        password: "securepassword123",
        name: "Test User",
      });

      expect(result.success).toBe(true);
      expect(mockAuthService.signUp).toHaveBeenCalled();
    }
  });
});
