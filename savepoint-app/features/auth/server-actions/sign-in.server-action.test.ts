import * as authModule from "@/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { signInAction } from "./sign-in";

// Mock the auth module
vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}));

describe("signInAction", () => {
  let mockSignIn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn = vi.mocked(authModule.signIn);
  });

  it("should successfully sign in with valid credentials", async () => {
    const signInData = {
      email: "user@example.com",
      password: "password123",
    };

    mockSignIn.mockResolvedValue(undefined);

    const result = await signInAction(signInData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message).toBe("Signed in successfully");
    }

    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "password123",
      redirectTo: "/dashboard",
    });
  });

  it("should return validation error for invalid email", async () => {
    const signInData = {
      email: "invalid-email",
      password: "password123",
    };

    const result = await signInAction(signInData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("email");
    }

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should return validation error for empty password", async () => {
    const signInData = {
      email: "user@example.com",
      password: "",
    };

    const result = await signInAction(signInData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Password");
    }

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should handle authentication errors from NextAuth", async () => {
    const signInData = {
      email: "user@example.com",
      password: "wrongpassword",
    };

    mockSignIn.mockRejectedValue(new Error("Invalid credentials"));

    const result = await signInAction(signInData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid email or password");
    }
  });

  it("should re-throw NEXT_REDIRECT errors for successful auth", async () => {
    const signInData = {
      email: "user@example.com",
      password: "password123",
    };

    const redirectError = new Error("NEXT_REDIRECT");
    mockSignIn.mockRejectedValue(redirectError);

    await expect(signInAction(signInData)).rejects.toThrow("NEXT_REDIRECT");
  });

  it("should handle unexpected errors gracefully", async () => {
    const signInData = {
      email: "user@example.com",
      password: "password123",
    };

    mockSignIn.mockRejectedValue(new Error("Database error"));

    const result = await signInAction(signInData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid email or password");
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
      const result = await signInAction({
        email,
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/email|validation/i);
      }
    }

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should accept any non-empty password for sign in", async () => {
    const passwords = ["a", "123", "short", "verylongpassword123456789"];

    mockSignIn.mockResolvedValue(undefined);

    for (const password of passwords) {
      vi.clearAllMocks();

      const result = await signInAction({
        email: "user@example.com",
        password,
      });

      expect(result.success).toBe(true);
      expect(mockSignIn).toHaveBeenCalled();
    }
  });

  it("should accept valid email formats", async () => {
    const validEmails = [
      "user@example.com",
      "user.name@example.com",
      "user+tag@example.co.uk",
      "user123@test-domain.com",
    ];

    mockSignIn.mockResolvedValue(undefined);

    for (const email of validEmails) {
      vi.clearAllMocks();

      const result = await signInAction({
        email,
        password: "password123",
      });

      expect(result.success).toBe(true);
      expect(mockSignIn).toHaveBeenCalled();
    }
  });
});
