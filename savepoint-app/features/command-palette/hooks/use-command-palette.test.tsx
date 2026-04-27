import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCommandPalette } from "./use-command-palette";

describe("useCommandPalette", () => {
  it("toggles open state on Cmd+K", () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.isOpen).toBe(false);

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
      document.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
      document.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("toggles open state on Ctrl+K", () => {
    const { result } = renderHook(() => useCommandPalette());

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
      document.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("ignores plain k presses", () => {
    const { result } = renderHook(() => useCommandPalette());

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(false);
  });
});
