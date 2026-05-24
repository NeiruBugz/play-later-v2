import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedGameSearch } from "./use-debounced-game-search";

const mockSearchGamesFn = vi.fn();
vi.mock("@/entities/game", () => ({
  searchGamesFn: (...args: unknown[]) => mockSearchGamesFn(...args),
}));

type Game = { id: number; name: string; slug: string };

function makeGame(id: number, name: string): Game {
  return { id, name, slug: name.toLowerCase().replace(/\s+/g, "-") };
}

describe("useDebouncedGameSearch", () => {
  beforeEach(() => {
    mockSearchGamesFn.mockReset();
  });

  describe("given the palette is open and a query is set below minQueryLength", () => {
    it("does not call searchGamesFn", async () => {
      const { result } = renderHook(() =>
        useDebouncedGameSearch({
          isOpen: true,
          debounceMs: 300,
          minQueryLength: 2,
        })
      );

      act(() => {
        result.current.setQuery("z");
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(mockSearchGamesFn).not.toHaveBeenCalled();
    });

    it("clears results when query drops below minQueryLength", () => {
      const { result } = renderHook(() =>
        useDebouncedGameSearch({
          isOpen: true,
          debounceMs: 300,
          minQueryLength: 2,
        })
      );

      act(() => {
        result.current.setQuery("z");
      });

      expect(result.current.results).toHaveLength(0);
    });
  });

  describe("given the palette is open and a query meets minQueryLength", () => {
    it("calls searchGamesFn after the debounce delay", async () => {
      mockSearchGamesFn.mockResolvedValue({ games: [makeGame(1, "Zelda")] });

      const { result } = renderHook(() =>
        useDebouncedGameSearch({
          isOpen: true,
          debounceMs: 300,
          minQueryLength: 1,
        })
      );

      act(() => {
        result.current.setQuery("zelda");
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(mockSearchGamesFn).toHaveBeenCalledOnce();
    });

    it("sets isLoading to true while the search is in flight", async () => {
      let resolveSearch: (value: { games: Game[] }) => void;
      const deferred = new Promise<{ games: Game[] }>((resolve) => {
        resolveSearch = resolve;
      });
      mockSearchGamesFn.mockReturnValue(deferred);

      const { result } = renderHook(() =>
        useDebouncedGameSearch({
          isOpen: true,
          debounceMs: 300,
          minQueryLength: 1,
        })
      );

      act(() => {
        result.current.setQuery("mario");
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSearch!({ games: [] });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("populates results after a successful search", async () => {
      const games = [makeGame(1, "Zelda"), makeGame(2, "Zelda 2")];
      mockSearchGamesFn.mockResolvedValue({ games });

      const { result } = renderHook(() =>
        useDebouncedGameSearch({
          isOpen: true,
          debounceMs: 300,
          minQueryLength: 1,
        })
      );

      act(() => {
        result.current.setQuery("zelda");
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.results).toHaveLength(2);
    });

    it("sets error state when the search fails", async () => {
      mockSearchGamesFn.mockRejectedValue(new Error("IGDB error"));

      const { result } = renderHook(() =>
        useDebouncedGameSearch({
          isOpen: true,
          debounceMs: 300,
          minQueryLength: 1,
        })
      );

      act(() => {
        result.current.setQuery("fail");
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.error?.message).toBe("IGDB error");
    });

    it("sets error to a wrapped Error when a non-Error is thrown", async () => {
      mockSearchGamesFn.mockRejectedValue("raw string error");

      const { result } = renderHook(() =>
        useDebouncedGameSearch({
          isOpen: true,
          debounceMs: 300,
          minQueryLength: 1,
        })
      );

      act(() => {
        result.current.setQuery("fail");
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("given the palette is closed", () => {
    it("resets query, results, and error when isOpen transitions to false", async () => {
      mockSearchGamesFn.mockResolvedValue({
        games: [makeGame(1, "Zelda")],
      });

      const { result, rerender } = renderHook(
        ({ isOpen }) =>
          useDebouncedGameSearch({
            isOpen,
            debounceMs: 300,
            minQueryLength: 1,
          }),
        { initialProps: { isOpen: true } }
      );

      act(() => {
        result.current.setQuery("zelda");
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.results.length).toBeGreaterThan(0);

      rerender({ isOpen: false });

      expect(result.current.query).toBe("");
      expect(result.current.results).toHaveLength(0);
    });
  });

  describe("shouldSearch flag", () => {
    it("is false when query is shorter than minQueryLength", () => {
      const { result } = renderHook(() =>
        useDebouncedGameSearch({ isOpen: true, minQueryLength: 2 })
      );

      act(() => {
        result.current.setQuery("z");
      });

      expect(result.current.shouldSearch).toBe(false);
    });

    it("is true when query meets minQueryLength", () => {
      const { result } = renderHook(() =>
        useDebouncedGameSearch({ isOpen: true, minQueryLength: 2 })
      );

      act(() => {
        result.current.setQuery("ze");
      });

      expect(result.current.shouldSearch).toBe(true);
    });
  });

  describe("given the palette closes while a debounce timer is still pending", () => {
    it("clears the pending timer on close so search is not triggered", async () => {
      mockSearchGamesFn.mockResolvedValue({ games: [] });

      const { result, rerender } = renderHook(
        ({ isOpen }) =>
          useDebouncedGameSearch({
            isOpen,
            debounceMs: 300,
            minQueryLength: 1,
          }),
        { initialProps: { isOpen: true } }
      );

      // Set a query to start the debounce timer.
      act(() => {
        result.current.setQuery("zelda");
      });

      // Close before the timer fires.
      rerender({ isOpen: false });

      // Advance time past the debounce window.
      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      // Search should NOT have been called because the timer was cleared on close.
      expect(mockSearchGamesFn).not.toHaveBeenCalled();
    });
  });

  describe("given the first of two in-flight queries rejects (stale-error guard in catch)", () => {
    it("does not update error state when a stale request rejects after a newer request started", async () => {
      let rejectFirst!: (reason: Error) => void;
      let resolveSecond!: (v: {
        games: { id: number; name: string; slug: string }[];
      }) => void;

      const firstDeferred = new Promise<never>((_, reject) => {
        rejectFirst = reject;
      });
      const secondDeferred = new Promise<{
        games: { id: number; name: string; slug: string }[];
      }>((resolve) => {
        resolveSecond = resolve;
      });

      mockSearchGamesFn
        .mockReturnValueOnce(firstDeferred)
        .mockReturnValueOnce(secondDeferred);

      const { result } = renderHook(() =>
        useDebouncedGameSearch({
          isOpen: true,
          debounceMs: 300,
          minQueryLength: 1,
        })
      );

      // First query fires after debounce.
      act(() => {
        result.current.setQuery("zelda");
      });
      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      // Second query starts — seq increments — before first rejects.
      act(() => {
        result.current.setQuery("mario");
      });
      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      // Resolve second query successfully.
      await act(async () => {
        resolveSecond({ games: [{ id: 2, name: "Mario", slug: "mario" }] });
      });

      // First query rejects AFTER second already resolved — stale, ignored.
      await act(async () => {
        rejectFirst(new Error("stale IGDB error"));
      });

      // Error should be null (stale rejection was ignored via the cancelled guard).
      expect(result.current.error).toBeNull();
      // Results should still reflect the second (non-stale) query.
      expect(result.current.results[0]?.name).toBe("Mario");
    });
  });

  describe("given a rapid sequence of queries (stale-request guard)", () => {
    it("only updates results from the last search when requests arrive out of order", async () => {
      let resolveFirst: (v: {
        games: { id: number; name: string; slug: string }[];
      }) => void;
      let resolveSecond: (v: {
        games: { id: number; name: string; slug: string }[];
      }) => void;

      const firstDeferred = new Promise<{
        games: { id: number; name: string; slug: string }[];
      }>((resolve) => {
        resolveFirst = resolve;
      });
      const secondDeferred = new Promise<{
        games: { id: number; name: string; slug: string }[];
      }>((resolve) => {
        resolveSecond = resolve;
      });

      mockSearchGamesFn
        .mockReturnValueOnce(firstDeferred)
        .mockReturnValueOnce(secondDeferred);

      const { result } = renderHook(() =>
        useDebouncedGameSearch({
          isOpen: true,
          debounceMs: 300,
          minQueryLength: 1,
        })
      );

      // First query — fires after debounce.
      act(() => {
        result.current.setQuery("zelda");
      });
      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      // Second query overrides before first resolves.
      act(() => {
        result.current.setQuery("mario");
      });
      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      // Resolve second first (the one we want).
      await act(async () => {
        resolveSecond!({ games: [{ id: 2, name: "Mario", slug: "mario" }] });
      });

      // Resolve first late (stale — should be ignored).
      await act(async () => {
        resolveFirst!({ games: [{ id: 1, name: "Zelda", slug: "zelda" }] });
      });

      // Only Mario (the second/newer result) should be set.
      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0]?.name).toBe("Mario");
    });
  });
});
