import { signUpAction } from "./sign-up";

const mockSignUpEmail = vi.fn();

vi.mock("@/shared/lib/auth", () => ({
  auth: {
    api: {
      signUpEmail: (...args: unknown[]) => mockSignUpEmail(...args),
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

describe("signUpAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to dashboard on successful sign up", async () => {
    const signUpData = {
      email: "newuser@example.com",
      password: "securepassword123",
      name: "John Doe",
    };

    mockSignUpEmail.mockResolvedValue({
      user: { id: "user-123", email: "newuser@example.com", name: "John Doe" },
      session: { id: "session-123" },
    });

    await expect(signUpAction(signUpData)).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard"
    );

    expect(mockSignUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          email: "newuser@example.com",
          password: "securepassword123",
          name: "John Doe",
        },
      })
    );
  });

  it("should sign up without name when name is not provided", async () => {
    const signUpData = {
      email: "newuser@example.com",
      password: "securepassword123",
    };

    mockSignUpEmail.mockResolvedValue({
      user: { id: "user-123", email: "newuser@example.com" },
      session: { id: "session-123" },
    });

    await expect(signUpAction(signUpData)).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard"
    );

    expect(mockSignUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          email: "newuser@example.com",
          password: "securepassword123",
          name: "",
        },
      })
    );
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

    expect(mockSignUpEmail).not.toHaveBeenCalled();
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

    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it("should handle unexpected errors", async () => {
    const signUpData = {
      email: "user@example.com",
      password: "securepassword123",
      name: "John Doe",
    };

    mockSignUpEmail.mockRejectedValue(new Error("Unexpected error"));

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

    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });
});
