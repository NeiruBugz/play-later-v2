import { APIError } from "better-auth/api";

import { signUpAction } from "./sign-up";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/auth", () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(),
    },
  },
}));

describe("signUpAction", () => {
  let mockSignUpEmail: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { auth } = await import("@/auth");
    mockSignUpEmail = vi.mocked(auth.api.signUpEmail);
  });

  it("should return success when BA creates the user", async () => {
    mockSignUpEmail.mockResolvedValue({
      user: { id: "u1", email: "newuser@example.com" },
    });

    const result = await signUpAction({
      email: "newuser@example.com",
      password: "securepassword123",
      name: "John Doe",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message).toBe("Account created successfully");
    }
    expect(mockSignUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          email: "newuser@example.com",
          password: "securepassword123",
          name: "John Doe",
        }),
      })
    );
  });

  it("should sign up without a name when name is not provided", async () => {
    mockSignUpEmail.mockResolvedValue({
      user: { id: "u1", email: "newuser@example.com" },
    });

    const result = await signUpAction({
      email: "newuser@example.com",
      password: "securepassword123",
    });

    expect(result.success).toBe(true);
    expect(mockSignUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          email: "newuser@example.com",
        }),
      })
    );
  });

  it("should surface BA error message when user already exists", async () => {
    mockSignUpEmail.mockRejectedValue(
      new APIError("UNPROCESSABLE_ENTITY", { message: "User already exists" })
    );

    const result = await signUpAction({
      email: "existing@example.com",
      password: "securepassword123",
      name: "John Doe",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("User already exists");
    }
  });

  it("should return validation error for invalid email", async () => {
    const result = await signUpAction({
      email: "invalid-email",
      password: "securepassword123",
      name: "John Doe",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/email/i);
    }
    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it("should return validation error for short password", async () => {
    const result = await signUpAction({
      email: "user@example.com",
      password: "short",
      name: "John Doe",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("8 characters");
    }
    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it("should surface raw error message when an unexpected Error is thrown", async () => {
    mockSignUpEmail.mockRejectedValue(new Error("Database connection failed"));

    const result = await signUpAction({
      email: "user@example.com",
      password: "securepassword123",
      name: "John Doe",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Database connection failed");
    }
  });

  it("should fall back to generic message when thrown value is not an Error", async () => {
    mockSignUpEmail.mockRejectedValue("string-not-error");

    const result = await signUpAction({
      email: "user@example.com",
      password: "securepassword123",
      name: "John Doe",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("An unexpected error occurred");
    }
  });

  it("should reject invalid email formats", async () => {
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

    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it("should accept valid email formats", async () => {
    const validEmails = [
      "user@example.com",
      "user.name@example.com",
      "user+tag@example.co.uk",
      "user123@test-domain.com",
    ];

    mockSignUpEmail.mockResolvedValue({ user: { id: "u1" } });

    for (const email of validEmails) {
      vi.clearAllMocks();
      mockSignUpEmail.mockResolvedValue({ user: { id: "u1" } });

      const result = await signUpAction({
        email,
        password: "securepassword123",
        name: "Test User",
      });

      expect(result.success).toBe(true);
      expect(mockSignUpEmail).toHaveBeenCalled();
    }
  });
});
