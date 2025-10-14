import * as authModule from "@/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { signInWithGoogleAction } from "./sign-in-google";

// Mock the auth module
vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}));

describe("signInWithGoogleAction", () => {
  let mockSignIn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn = vi.mocked(authModule.signIn);
  });

  it("should call signIn with google provider and redirect to dashboard", async () => {
    mockSignIn.mockResolvedValue(undefined);

    await signInWithGoogleAction();

    expect(mockSignIn).toHaveBeenCalledWith("google", {
      redirectTo: "/dashboard",
    });
  });

  it("should handle errors from NextAuth", async () => {
    mockSignIn.mockRejectedValue(new Error("OAuth error"));

    await expect(signInWithGoogleAction()).rejects.toThrow("OAuth error");
  });

  it("should allow NEXT_REDIRECT errors to bubble up", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    mockSignIn.mockRejectedValue(redirectError);

    await expect(signInWithGoogleAction()).rejects.toThrow("NEXT_REDIRECT");
  });
});
