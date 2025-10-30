import { render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkUsernameAvailability } from "../server-actions/check-username-availability";
import { UsernameInput } from "./username-input";

// Mock the server action
vi.mock("../server-actions/check-username-availability", () => ({
  checkUsernameAvailability: vi.fn(),
}));

const mockCheckUsername = vi.mocked(checkUsernameAvailability);

describe("UsernameInput", () => {
  beforeEach(() => {
    mockCheckUsername.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  // ============================================================
  // Rendering Tests (3 tests)
  // ============================================================

  it("should render with default label 'Username'", () => {
    render(<UsernameInput value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
  });

  it("should render with custom label", () => {
    render(
      <UsernameInput
        value=""
        onChange={() => {}}
        label="Custom Username Label"
      />
    );
    expect(screen.getByLabelText("Custom Username Label")).toBeInTheDocument();
  });

  it("should show external error prop", () => {
    render(
      <UsernameInput
        value="test"
        onChange={() => {}}
        error="External validation error"
      />
    );
    expect(screen.getByText("External validation error")).toBeInTheDocument();
  });

  // ============================================================
  // Client-Side Validation Tests (4 tests)
  // ============================================================

  it("should show error for username less than 3 characters", () => {
    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    rerender(<UsernameInput value="ab" onChange={() => {}} />);

    expect(
      screen.getByText("Username must be at least 3 characters")
    ).toBeInTheDocument();
    expect(mockCheckUsername).not.toHaveBeenCalled();
  });

  it("should show error for username more than 25 characters", () => {
    const longUsername = "a".repeat(26);
    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    rerender(<UsernameInput value={longUsername} onChange={() => {}} />);

    expect(
      screen.getByText("Username must not exceed 25 characters")
    ).toBeInTheDocument();
    expect(mockCheckUsername).not.toHaveBeenCalled();
  });

  it("should not validate empty input", () => {
    render(<UsernameInput value="" onChange={() => {}} />);

    // No error or success message should be shown for empty input
    expect(screen.queryByText(/username must/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/username available/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should transition from error to validating when length becomes valid", () => {
    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    // Start with invalid length
    rerender(<UsernameInput value="ab" onChange={() => {}} />);
    expect(
      screen.getByText("Username must be at least 3 characters")
    ).toBeInTheDocument();

    // Make it valid - should show loading immediately
    rerender(<UsernameInput value="abc" onChange={() => {}} />);
    expect(
      screen.queryByText("Username must be at least 3 characters")
    ).not.toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  // ============================================================
  // Debounced Validation Tests (5 tests)
  // ============================================================

  it("should not call server before 500ms", () => {
    vi.useFakeTimers();
    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    rerender(<UsernameInput value="testuser" onChange={() => {}} />);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockCheckUsername).not.toHaveBeenCalled();
  });

  it("should call server after 500ms", async () => {
    vi.useFakeTimers();
    mockCheckUsername.mockResolvedValue({ success: true, available: true });

    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    rerender(<UsernameInput value="testuser" onChange={() => {}} />);

    await act(async () => {
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
    });

    expect(mockCheckUsername).toHaveBeenCalledWith({ username: "testuser" });
  });

  it("should cancel previous call on rapid typing - only one final call", async () => {
    vi.useFakeTimers();
    mockCheckUsername.mockResolvedValue({ success: true, available: true });

    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    // Type first value
    rerender(<UsernameInput value="test" onChange={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Type second value before timeout
    rerender(<UsernameInput value="testuser" onChange={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Type third value before timeout
    rerender(<UsernameInput value="testuser123" onChange={() => {}} />);

    await act(async () => {
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
    });

    // Only the last value should be validated
    expect(mockCheckUsername).toHaveBeenCalledTimes(1);
    expect(mockCheckUsername).toHaveBeenCalledWith({
      username: "testuser123",
    });
  });

  it("should show loading state while validating", () => {
    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    rerender(<UsernameInput value="testuser" onChange={() => {}} />);

    // Loading state should appear immediately for valid input
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("should reset timer when value changes", async () => {
    vi.useFakeTimers();
    mockCheckUsername.mockResolvedValue({ success: true, available: true });

    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    rerender(<UsernameInput value="test" onChange={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Change value - resets timer
    rerender(<UsernameInput value="test2" onChange={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Should not have called yet
    expect(mockCheckUsername).not.toHaveBeenCalled();

    // Complete the timer
    await act(async () => {
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
    });

    expect(mockCheckUsername).toHaveBeenCalledWith({ username: "test2" });
  });

  // ============================================================
  // Server Validation States Tests (4 tests)
  // ============================================================

  it("should show 'Username available' with checkmark for available username", async () => {
    vi.useFakeTimers();
    mockCheckUsername.mockResolvedValue({ success: true, available: true });

    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    rerender(<UsernameInput value="available" onChange={() => {}} />);

    await act(async () => {
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText("Username available")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should show 'Username already exists' with error for taken username", async () => {
    vi.useFakeTimers();
    mockCheckUsername.mockResolvedValue({ success: true, available: false });

    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    rerender(<UsernameInput value="taken" onChange={() => {}} />);

    await act(async () => {
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText("Username already exists")).toBeInTheDocument();
    // Check for X icon
    const icons = document.querySelectorAll(".text-red-500");
    expect(icons.length).toBeGreaterThan(0);
  });

  it("should show error message for server validation failure", async () => {
    vi.useFakeTimers();
    mockCheckUsername.mockResolvedValue({
      success: false,
      error: "Database connection failed",
    });

    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    rerender(<UsernameInput value="testuser" onChange={() => {}} />);

    await act(async () => {
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText("Database connection failed")).toBeInTheDocument();
  });

  it("should show error message for network error", async () => {
    vi.useFakeTimers();
    mockCheckUsername.mockRejectedValue(new Error("Network error"));

    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    rerender(<UsernameInput value="testuser" onChange={() => {}} />);

    await act(async () => {
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
    });

    expect(
      screen.getByText("Failed to check username availability")
    ).toBeInTheDocument();
  });

  // ============================================================
  // External Error Tests (2 tests)
  // ============================================================

  it("should have external error override internal validation", async () => {
    vi.useFakeTimers();
    mockCheckUsername.mockResolvedValue({ success: true, available: true });

    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    rerender(<UsernameInput value="testuser" onChange={() => {}} />);

    await act(async () => {
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
    });

    // Verify success state
    expect(screen.getByText("Username available")).toBeInTheDocument();

    // Add external error
    rerender(
      <UsernameInput
        value="testuser"
        onChange={() => {}}
        error="Form submission failed"
      />
    );

    // External error should override
    expect(screen.getByText("Form submission failed")).toBeInTheDocument();
    expect(screen.queryByText("Username available")).not.toBeInTheDocument();
  });

  it("should hide success state when external error present", async () => {
    vi.useFakeTimers();
    mockCheckUsername.mockResolvedValue({ success: true, available: true });

    render(
      <UsernameInput
        value="testuser"
        onChange={() => {}}
        error="External error"
      />
    );

    await act(async () => {
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
    });

    // Success checkmark should not appear
    expect(document.querySelector(".text-green-500")).not.toBeInTheDocument();
    expect(screen.getByText("External error")).toBeInTheDocument();
  });

  // ============================================================
  // Edge Cases Tests (2 tests)
  // ============================================================

  it("should treat whitespace-only input as empty", async () => {
    vi.useFakeTimers();
    const { rerender } = render(<UsernameInput value="" onChange={() => {}} />);

    rerender(<UsernameInput value="   " onChange={() => {}} />);

    await act(async () => {
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
    });

    // Should not call server or show any validation
    expect(mockCheckUsername).not.toHaveBeenCalled();
    expect(screen.queryByText(/username must/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/username available/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should cleanup timer on component unmount", async () => {
    vi.useFakeTimers();
    const { rerender, unmount } = render(
      <UsernameInput value="" onChange={() => {}} />
    );

    rerender(<UsernameInput value="testuser" onChange={() => {}} />);

    // Advance partway through timer
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Unmount before timer completes
    unmount();

    // Advance remaining time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Server should not be called after unmount
    expect(mockCheckUsername).not.toHaveBeenCalled();
  });
});
