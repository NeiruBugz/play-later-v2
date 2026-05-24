/**
 * Unit tests for useUsernameValidation.
 *
 * The hook debounces the availability check. We use vi.advanceTimersByTime
 * (fake timers are already set up globally in test/setup/unit.ts) to skip
 * the debounce window and observe the resulting status.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUsernameValidation } from "./use-username-validation";

// Mock the checkUsernameFn createServerFn wrapper — we cannot load the
// TanStack Start runtime in jsdom.
const mockCheckUsernameFn = vi.fn();

vi.mock("../api/update-profile", () => ({
  checkUsernameFn: (...args: unknown[]) => mockCheckUsernameFn(...args),
}));

describe("useUsernameValidation", () => {
  beforeEach(() => {
    mockCheckUsernameFn.mockReset();
  });

  describe("given an empty username", () => {
    it("stays idle without calling checkUsernameFn", () => {
      const { result } = renderHook(() => useUsernameValidation("", undefined));
      expect(result.current.validationStatus).toBe("idle");
      expect(mockCheckUsernameFn).not.toHaveBeenCalled();
    });
  });

  describe("given username equals the current username (no change)", () => {
    it("stays idle without calling checkUsernameFn", () => {
      const { result } = renderHook(() =>
        useUsernameValidation("alice", "alice")
      );
      expect(result.current.validationStatus).toBe("idle");
      expect(mockCheckUsernameFn).not.toHaveBeenCalled();
    });
  });

  describe("given a new username that is available", () => {
    beforeEach(() => {
      mockCheckUsernameFn.mockResolvedValue({ available: true });
    });

    it("becomes 'available' after the debounce fires and the check resolves", async () => {
      const { result } = renderHook(() =>
        useUsernameValidation("newuser", "olduser")
      );

      // Immediately after render: debounce is still running.
      expect(result.current.validationStatus).toBe("validating");

      // Advance past the debounce window.
      act(() => {
        vi.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.validationStatus).toBe("available");
      });

      expect(result.current.validationMessage).toBe("Username available");
    });
  });

  describe("given a new username that is already taken", () => {
    beforeEach(() => {
      mockCheckUsernameFn.mockResolvedValue({ available: false });
    });

    it("becomes 'error' after the debounce fires and the check resolves unavailable", async () => {
      const { result } = renderHook(() =>
        useUsernameValidation("takenuser", "olduser")
      );

      act(() => {
        vi.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.validationStatus).toBe("error");
      });

      expect(result.current.validationMessage).toBe("Username already exists");
    });
  });

  describe("given the username changes again before the async check resolves (cancelled branch)", () => {
    it("does not update status when the effect is cancelled before the check resolves", async () => {
      // Use a promise that we control — never resolve it during this test so the
      // cancelled guard runs before the promise settles.
      let resolveCheck!: (v: { available: boolean }) => void;
      mockCheckUsernameFn.mockReturnValue(
        new Promise<{ available: boolean }>((resolve) => {
          resolveCheck = resolve;
        })
      );

      const { result, rerender } = renderHook(
        ({ username }: { username: string }) =>
          useUsernameValidation(username, "olduser"),
        { initialProps: { username: "firstuser" } }
      );

      // Advance past the debounce — the check is now in-flight but not resolved.
      act(() => {
        vi.runAllTimers();
      });
      expect(result.current.validationStatus).toBe("validating");

      // Change the username — this triggers the effect cleanup which sets cancelled = true.
      rerender({ username: "seconduser" });

      // Now resolve the original check — should be a no-op because cancelled = true.
      act(() => {
        resolveCheck({ available: true });
      });

      // Status should remain "validating" for the new username (not "available"
      // from the cancelled first check).
      expect(result.current.validationStatus).toBe("validating");
    });
  });
});
