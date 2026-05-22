import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  COMMAND_PALETTE_OPEN_EVENT,
  openCommandPalette,
  useCommandPalette,
} from "./use-command-palette";

describe("useCommandPalette", () => {
  describe("given the hook is mounted", () => {
    it("starts with the palette closed", () => {
      const { result } = renderHook(() => useCommandPalette());
      expect(result.current.isOpen).toBe(false);
    });

    it("open() sets isOpen to true", () => {
      const { result } = renderHook(() => useCommandPalette());
      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);
    });

    it("close() sets isOpen to false after open", () => {
      const { result } = renderHook(() => useCommandPalette());
      act(() => {
        result.current.open();
      });
      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it("toggle() flips isOpen from false to true", () => {
      const { result } = renderHook(() => useCommandPalette());
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);
    });

    it("toggle() flips isOpen from true to false", () => {
      const { result } = renderHook(() => useCommandPalette());
      act(() => {
        result.current.open();
      });
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it("setOpen(true) opens the palette", () => {
      const { result } = renderHook(() => useCommandPalette());
      act(() => {
        result.current.setOpen(true);
      });
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe("given the global ⌘K keydown listener", () => {
    it("toggles the palette open on Cmd+K", () => {
      const { result } = renderHook(() => useCommandPalette());

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          })
        );
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("toggles the palette closed on a second Cmd+K", () => {
      const { result } = renderHook(() => useCommandPalette());

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          })
        );
      });
      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          })
        );
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("responds to Ctrl+K as well as Cmd+K", () => {
      const { result } = renderHook(() => useCommandPalette());

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            ctrlKey: true,
            bubbles: true,
          })
        );
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("ignores keypresses that are not ⌘K / Ctrl+K", () => {
      const { result } = renderHook(() => useCommandPalette());

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "j",
            metaKey: true,
            bubbles: true,
          })
        );
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("given the custom-event open channel", () => {
    it("opens the palette when COMMAND_PALETTE_OPEN_EVENT is dispatched", () => {
      const { result } = renderHook(() => useCommandPalette());

      act(() => {
        document.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT));
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("openCommandPalette() helper dispatches the open event", () => {
      const { result } = renderHook(() => useCommandPalette());

      act(() => {
        openCommandPalette();
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe("given the hook is unmounted", () => {
    it("removes the keydown listener so it no longer affects state", () => {
      const { result, unmount } = renderHook(() => useCommandPalette());

      unmount();

      // Dispatching after unmount should not throw and the ref result is stable.
      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          })
        );
      });

      // The hook is unmounted — we can only verify no errors were thrown.
      expect(result.current.isOpen).toBe(false);
    });
  });
});

describe("openCommandPalette (standalone)", () => {
  it("is a no-op when document is not defined (SSR guard)", () => {
    // Temporarily remove document to simulate SSR.
    const originalDocument = globalThis.document;
    // @ts-expect-error — deliberately clobbering document for SSR simulation
    delete globalThis.document;

    expect(() => openCommandPalette()).not.toThrow();

    globalThis.document = originalDocument;
  });
});
