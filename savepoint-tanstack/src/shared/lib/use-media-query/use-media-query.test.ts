import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIsDesktop, useMediaQuery } from "@/shared/lib/use-media-query";

type MediaQueryChangeListener = (event: MediaQueryListEvent) => void;

interface MockMQL {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  _listeners: Map<string, MediaQueryChangeListener[]>;
  _fireChange: (matches: boolean) => void;
}

function createMockMQL(initialMatches: boolean): MockMQL {
  const listeners = new Map<string, MediaQueryChangeListener[]>();

  const mql: MockMQL = {
    matches: initialMatches,
    addEventListener: vi.fn(
      (event: string, handler: MediaQueryChangeListener) => {
        const existing = listeners.get(event) ?? [];
        listeners.set(event, [...existing, handler]);
      }
    ),
    removeEventListener: vi.fn(
      (event: string, handler: MediaQueryChangeListener) => {
        const existing = listeners.get(event) ?? [];
        listeners.set(
          event,
          existing.filter((h) => h !== handler)
        );
      }
    ),
    _listeners: listeners,
    _fireChange(matches: boolean) {
      mql.matches = matches;
      const handlers = listeners.get("change") ?? [];
      for (const h of handlers) {
        h({ matches } as unknown as MediaQueryListEvent);
      }
    },
  };
  return mql;
}

describe("useMediaQuery", () => {
  let mockMQL: MockMQL;

  beforeEach(() => {
    mockMQL = createMockMQL(false);
    vi.stubGlobal("matchMedia", () => mockMQL);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("given a query that does not initially match", () => {
    it("returns false on initial render", () => {
      const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

      expect(result.current).toBe(false);
    });
  });

  describe("given a query that initially matches", () => {
    beforeEach(() => {
      mockMQL = createMockMQL(true);
      vi.stubGlobal("matchMedia", () => mockMQL);
    });

    it("returns true after the effect reads the initial match", () => {
      const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

      expect(result.current).toBe(true);
    });
  });

  describe("given the media query changes after mount", () => {
    it("updates the returned value when the query becomes matching", () => {
      mockMQL = createMockMQL(false);
      vi.stubGlobal("matchMedia", () => mockMQL);

      const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

      expect(result.current).toBe(false);

      act(() => {
        mockMQL._fireChange(true);
      });

      expect(result.current).toBe(true);
    });

    it("updates the returned value when the query stops matching", () => {
      mockMQL = createMockMQL(true);
      vi.stubGlobal("matchMedia", () => mockMQL);

      const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

      expect(result.current).toBe(true);

      act(() => {
        mockMQL._fireChange(false);
      });

      expect(result.current).toBe(false);
    });
  });

  describe("given matchMedia is not available (SSR-like environment)", () => {
    it("returns false without throwing", () => {
      vi.stubGlobal("matchMedia", undefined);

      const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

      expect(result.current).toBe(false);
    });
  });
});

describe("useIsDesktop", () => {
  let mockMQL: MockMQL;

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("given a desktop viewport width", () => {
    beforeEach(() => {
      mockMQL = createMockMQL(true);
      vi.stubGlobal("matchMedia", (query: string) => {
        expect(query).toBe("(min-width: 768px)");
        return mockMQL;
      });
    });

    it("returns true and queries the desktop breakpoint", () => {
      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(true);
    });
  });

  describe("given a mobile viewport width", () => {
    beforeEach(() => {
      mockMQL = createMockMQL(false);
      vi.stubGlobal("matchMedia", () => mockMQL);
    });

    it("returns false", () => {
      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(false);
    });
  });
});
