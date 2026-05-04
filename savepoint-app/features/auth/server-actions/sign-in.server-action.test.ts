import { APIError } from "better-auth/api";

import { signInAction } from "./sign-in";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/auth", () => ({
  auth: {
    api: {
      signInEmail: vi.fn(),
    },
  },
}));

describe("signInAction", () => {
  let mockSignInEmail: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { auth } = await import("@/auth");
    mockSignInEmail = vi.mocked(auth.api.signInEmail);
  });

  it("should return success on valid credentials", async () => {
    mockSignInEmail.mockResolvedValue({ user: { id: "u1" } });

    const result = await signInAction({
      email: "user@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message).toBe("Signed in successfully");
    }
    expect(mockSignInEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { email: "user@example.com", password: "password123" },
      })
    );
  });

  it("should return validation error for invalid email", async () => {
    const result = await signInAction({
      email: "not-an-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/email/i);
    }
    expect(mockSignInEmail).not.toHaveBeenCalled();
  });

  it("should return validation error for empty password", async () => {
    const result = await signInAction({
      email: "user@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/password/i);
    }
    expect(mockSignInEmail).not.toHaveBeenCalled();
  });

  it("should return invalid credentials error when BA throws APIError", async () => {
    mockSignInEmail.mockRejectedValue(
      new APIError("UNAUTHORIZED", { message: "Invalid credentials" })
    );

    const result = await signInAction({
      email: "user@example.com",
      password: "wrongpassword",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid email or password");
    }
  });

  it("should return generic error message on unexpected error", async () => {
    mockSignInEmail.mockRejectedValue(new Error("Database error"));

    const result = await signInAction({
      email: "user@example.com",
      password: "password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("An unexpected error occurred");
    }
  });

  it("should accept valid email formats", async () => {
    const validEmails = [
      "user@example.com",
      "user.name@example.com",
      "user+tag@example.co.uk",
      "user123@test-domain.com",
    ];

    mockSignInEmail.mockResolvedValue({ user: { id: "u1" } });

    for (const email of validEmails) {
      vi.clearAllMocks();
      mockSignInEmail.mockResolvedValue({ user: { id: "u1" } });

      const result = await signInAction({ email, password: "password123" });

      expect(result.success).toBe(true);
      expect(mockSignInEmail).toHaveBeenCalled();
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
      const result = await signInAction({ email, password: "password123" });
      expect(result.success).toBe(false);
    }

    expect(mockSignInEmail).not.toHaveBeenCalled();
  });
});
