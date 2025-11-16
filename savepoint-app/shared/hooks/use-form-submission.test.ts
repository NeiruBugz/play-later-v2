/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useFormSubmission } from "./use-form-submission";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useFormSubmission", () => {
  it("should set isSubmitting to false after successful action", async () => {
    const mockAction = vi.fn().mockResolvedValue({ success: true, data: {} });

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction,
      })
    );

    await result.current.handleSubmit({ test: "data" });

    expect(result.current.isSubmitting).toBe(false);
  });

  it("should set isSubmitting to false after failed action", async () => {
    const mockAction = vi
      .fn()
      .mockResolvedValue({ success: false, error: "Test error" });

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction,
      })
    );

    await result.current.handleSubmit({ test: "data" });

    expect(result.current.isSubmitting).toBe(false);
  });

  it("should call onSuccess callback when action succeeds", async () => {
    const mockData = { id: 1, name: "Test" };
    const mockAction = vi
      .fn()
      .mockResolvedValue({ success: true, data: mockData });
    const mockOnSuccess = vi.fn();

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction,
        onSuccess: mockOnSuccess,
      })
    );

    await result.current.handleSubmit({ test: "data" });

    expect(mockOnSuccess).toHaveBeenCalledWith(mockData);
  });

  it("should call onError callback when action fails", async () => {
    const errorMessage = "Test error";
    const mockAction = vi
      .fn()
      .mockResolvedValue({ success: false, error: errorMessage });
    const mockOnError = vi.fn();

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction,
        onError: mockOnError,
      })
    );

    await result.current.handleSubmit({ test: "data" });

    expect(mockOnError).toHaveBeenCalledWith(errorMessage);
  });

  it("should show success toast with message and description", async () => {
    const { toast } = await import("sonner");
    const mockData = { title: "Test Game" };
    const mockAction = vi
      .fn()
      .mockResolvedValue({ success: true, data: mockData });

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction,
        successMessage: "Success!",
        successDescription: "Operation completed",
      })
    );

    await result.current.handleSubmit({ test: "data" });

    expect(toast.success).toHaveBeenCalledWith("Success!", {
      description: "Operation completed",
    });
  });

  it("should support function-based success messages", async () => {
    const { toast } = await import("sonner");
    const mockData = { title: "Test Game" };
    const mockAction = vi
      .fn()
      .mockResolvedValue({ success: true, data: mockData });

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction,
        successMessage: (data: typeof mockData) => `Added ${data.title}`,
        successDescription: (data: typeof mockData) =>
          `${data.title} is now in your library`,
      })
    );

    await result.current.handleSubmit({ test: "data" });

    expect(toast.success).toHaveBeenCalledWith("Added Test Game", {
      description: "Test Game is now in your library",
    });
  });

  it("should show error toast when action fails", async () => {
    const { toast } = await import("sonner");
    const mockAction = vi
      .fn()
      .mockResolvedValue({ success: false, error: "Validation failed" });

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction,
        errorMessage: "Failed to save",
      })
    );

    await result.current.handleSubmit({ test: "data" });

    expect(toast.error).toHaveBeenCalledWith("Failed to save", {
      description: "Validation failed",
    });
  });

  it("should handle unexpected errors with toast", async () => {
    const { toast } = await import("sonner");
    const mockAction = vi.fn().mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction,
      })
    );

    await result.current.handleSubmit({ test: "data" });

    expect(toast.error).toHaveBeenCalledWith("An unexpected error occurred", {
      description: "Network error",
    });
  });

  it("should set isSubmitting to false even if action throws", async () => {
    const mockAction = vi.fn().mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useFormSubmission({
        action: mockAction,
      })
    );

    await result.current.handleSubmit({ test: "data" });

    expect(result.current.isSubmitting).toBe(false);
  });
});
