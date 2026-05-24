import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CURRENT_VERSION, WHATS_NEW_STORAGE_KEY } from "../config";
import { useWhatsNew } from "./use-whats-new";

describe("useWhatsNew", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("given localStorage has no stored version (first visit)", () => {
    it("starts with isOpen = true", () => {
      const { result } = renderHook(() => useWhatsNew());
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe("given localStorage contains the current version", () => {
    beforeEach(() => {
      localStorage.setItem(WHATS_NEW_STORAGE_KEY, CURRENT_VERSION);
    });

    it("starts with isOpen = false", () => {
      const { result } = renderHook(() => useWhatsNew());
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("given the user calls dismiss()", () => {
    it("sets isOpen to false", () => {
      const { result } = renderHook(() => useWhatsNew());
      act(() => {
        result.current.dismiss();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it("writes CURRENT_VERSION to localStorage", () => {
      const { result } = renderHook(() => useWhatsNew());
      act(() => {
        result.current.dismiss();
      });
      expect(localStorage.getItem(WHATS_NEW_STORAGE_KEY)).toBe(CURRENT_VERSION);
    });
  });

  describe("given localStorage.getItem throws (private mode / quota)", () => {
    beforeEach(() => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("localStorage unavailable");
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("treats the storage error as unseen — isOpen becomes true", () => {
      const { result } = renderHook(() => useWhatsNew());
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe("given localStorage.setItem throws on dismiss (private mode / quota)", () => {
    beforeEach(() => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("quota exceeded");
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("still closes the modal even when the write fails", () => {
      const { result } = renderHook(() => useWhatsNew());
      act(() => {
        result.current.dismiss();
      });
      expect(result.current.isOpen).toBe(false);
    });
  });
});
