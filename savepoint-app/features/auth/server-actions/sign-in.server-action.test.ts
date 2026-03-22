import { signInAction } from "./sign-in";

const mockSignInEmail = vi.fn();

vi.mock("@/shared/lib/auth", () => ({
  auth: {
    api: {
      signInEmail: (...args: unknown[]) => mockSignInEmail(...args),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

describe("signInAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to dashboard on successful sign in", async () => {
    const signInData = {
      email: "user@example.com",
      password: "password123",
    };

    mockSignInEmail.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
      session: { id: "session-123" },
    });

    await expect(signInAction(signInData)).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard"
    );

    expect(mockSignInEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          email: "user@example.com",
          password: "password123",
        },
      })
    );
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

    expect(mockSignInEmail).not.toHaveBeenCalled();
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

    expect(mockSignInEmail).not.toHaveBeenCalled();
  });

  it("should return error on invalid credentials", async () => {
    const signInData = {
      email: "user@example.com",
      password: "wrongpassword",
    };

    mockSignInEmail.mockRejectedValue(new Error("Invalid credentials"));

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

    expect(mockSignInEmail).not.toHaveBeenCalled();
  });

  it("should accept valid email formats", async () => {
    const validEmails = [
      "user@example.com",
      "user.name@example.com",
      "user+tag@example.co.uk",
      "user123@test-domain.com",
    ];

    mockSignInEmail.mockResolvedValue({
      user: { id: "user-123" },
      session: { id: "session-123" },
    });

    for (const email of validEmails) {
      vi.clearAllMocks();
      mockSignInEmail.mockResolvedValue({
        user: { id: "user-123" },
        session: { id: "session-123" },
      });

      await expect(
        signInAction({ email, password: "password123" })
      ).rejects.toThrow("NEXT_REDIRECT:/dashboard");

      expect(mockSignInEmail).toHaveBeenCalled();
    }
  });
});
