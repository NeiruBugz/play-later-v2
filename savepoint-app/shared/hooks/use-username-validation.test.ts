import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkUsernameAvailability } from "@/shared/server-actions/profile";

import { useUsernameValidation } from "./use-username-validation";

vi.mock("@/shared/server-actions/profile", () => ({
  checkUsernameAvailability: vi.fn(),
}));

const mockCheckUsernameAvailability = vi.mocked(checkUsernameAvailability);

describe("useUsernameValidation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockCheckUsernameAvailability.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return idle status initially", () => {
    const { result } = renderHook(() => useUsernameValidation(""));
    expect(result.current.validationStatus).toBe("idle");
  });

  it("should return error for short username", () => {
    const { result } = renderHook(() => useUsernameValidation("ab"));
    expect(result.current.validationStatus).toBe("error");
    expect(result.current.validationMessage).toMatch(/at least 3 characters/);
  });

  it("should return error for long username", () => {
    const { result } = renderHook(() => useUsernameValidation("a".repeat(26)));
    expect(result.current.validationStatus).toBe("error");
    expect(result.current.validationMessage).toMatch(
      /not exceed 25 characters/
    );
  });

  it("should validate availability for valid username", async () => {
    mockCheckUsernameAvailability.mockResolvedValue({
      success: true,
      available: true,
    });

    const { result } = renderHook(() => useUsernameValidation("validuser"));

    // Should be validating initially (after debounce)
    expect(result.current.validationStatus).toBe("validating");

    // Fast-forward debounce time
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.validationStatus).toBe("available");
    expect(result.current.validationMessage).toBe("Username available");
  });

  it("should return error if username is taken", async () => {
    mockCheckUsernameAvailability.mockResolvedValue({
      success: true,
      available: false,
    });

    const { result } = renderHook(() => useUsernameValidation("takenuser"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.validationStatus).toBe("error");
    expect(result.current.validationMessage).toBe("Username already exists");
  });

  // This test reproduces the bug
  it("should skip validation if username matches currentUsername", async () => {
    const currentUsername = "myusername";
    const { result } = renderHook(() =>
      useUsernameValidation(currentUsername, currentUsername)
    );

    // Should be idle immediately, not validating
    expect(result.current.validationStatus).toBe("idle");

    // Even after debounce, should remain idle and not call API
    await vi.advanceTimersByTimeAsync(500);

    expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    expect(result.current.validationStatus).toBe("idle");
  });
});
