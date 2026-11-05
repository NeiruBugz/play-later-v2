import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLibraryFiltersState } from "./use-library-filters-state";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const defaultInput = {
  status: undefined,
  platform: undefined,
  minRating: undefined,
  unratedOnly: undefined,
  notOwnedOnly: undefined,
  sortBy: "updatedAt" as const,
  sortOrder: "desc" as const,
};

describe("useLibraryFiltersState", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe("given no active filters", () => {
    it("hasActiveFilters is false and activeFilterCount is 0", () => {
      const { result } = renderHook(() => useLibraryFiltersState(defaultInput));
      expect(result.current.hasActiveFilters).toBe(false);
      expect(result.current.activeFilterCount).toBe(0);
    });
  });

  describe("given status is set", () => {
    it("hasActiveFilters is true", () => {
      const { result } = renderHook(() =>
        useLibraryFiltersState({ ...defaultInput, status: "PLAYING" })
      );
      expect(result.current.hasActiveFilters).toBe(true);
      expect(result.current.activeFilterCount).toBe(1);
    });
  });

  describe("onMinRatingChange", () => {
    it("calls navigate with minRating set to the number when next is non-null", () => {
      const { result } = renderHook(() => useLibraryFiltersState(defaultInput));
      act(() => {
        result.current.onMinRatingChange(7);
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ minRating: 7 }),
        })
      );
    });

    it("calls navigate with minRating undefined when next is null (clear path)", () => {
      const { result } = renderHook(() =>
        useLibraryFiltersState({ ...defaultInput, minRating: 7 })
      );
      act(() => {
        result.current.onMinRatingChange(null);
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ minRating: undefined }),
        })
      );
    });
  });

  describe("onClearAll", () => {
    it("resets all filters and calls onAfterClear if provided", () => {
      const onAfterClear = vi.fn();
      const { result } = renderHook(() =>
        useLibraryFiltersState({
          ...defaultInput,
          status: "PLAYING",
          minRating: 7,
        })
      );
      act(() => {
        result.current.onClearAll({ onAfterClear });
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({
            status: undefined,
            minRating: undefined,
          }),
        })
      );
      expect(onAfterClear).toHaveBeenCalledOnce();
    });
  });

  describe("onSortChange", () => {
    it("does not call navigate when the sort value is not in the map", () => {
      const { result } = renderHook(() => useLibraryFiltersState(defaultInput));
      act(() => {
        result.current.onSortChange("invalid-sort-key");
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("calls navigate with the mapped sortBy and sortOrder when value is valid", () => {
      const { result } = renderHook(() => useLibraryFiltersState(defaultInput));
      act(() => {
        result.current.onSortChange("updatedAt-desc");
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ sortBy: "updatedAt" }),
        })
      );
    });
  });

  describe("onPlatformChange", () => {
    it("calls navigate with platform undefined when value is __all__", () => {
      const { result } = renderHook(() => useLibraryFiltersState(defaultInput));
      act(() => {
        result.current.onPlatformChange("__all__");
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ platform: undefined }),
        })
      );
    });

    it("calls navigate with the platform string when value is a specific platform", () => {
      const { result } = renderHook(() => useLibraryFiltersState(defaultInput));
      act(() => {
        result.current.onPlatformChange("PC");
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ platform: "PC" }),
        })
      );
    });
  });

  describe("onStatusAll", () => {
    it("calls navigate with status undefined", () => {
      const { result } = renderHook(() =>
        useLibraryFiltersState({ ...defaultInput, status: "PLAYING" })
      );
      act(() => {
        result.current.onStatusAll();
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ status: undefined }),
        })
      );
    });
  });

  describe("onUnratedOnlyChange", () => {
    it("calls navigate with unratedOnly true when checked", () => {
      const { result } = renderHook(() => useLibraryFiltersState(defaultInput));
      act(() => {
        result.current.onUnratedOnlyChange(true);
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ unratedOnly: true }),
        })
      );
    });

    it("calls navigate with unratedOnly undefined when unchecked", () => {
      const { result } = renderHook(() =>
        useLibraryFiltersState({ ...defaultInput, unratedOnly: true })
      );
      act(() => {
        result.current.onUnratedOnlyChange(false);
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ unratedOnly: undefined }),
        })
      );
    });
  });

  describe("onStatusPick", () => {
    it("deselects the status when clicking the already-selected status", () => {
      const { result } = renderHook(() =>
        useLibraryFiltersState({ ...defaultInput, status: "PLAYING" })
      );
      act(() => {
        result.current.onStatusPick("PLAYING");
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ status: undefined }),
        })
      );
    });
  });

  describe("onNotOwnedOnlyChange", () => {
    it("sets and clears notOwnedOnly", () => {
      const { result } = renderHook(() =>
        useLibraryFiltersState({ ...defaultInput, status: "WANT" })
      );
      act(() => result.current.onNotOwnedOnlyChange(true));
      expect(mockNavigate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ notOwnedOnly: true }),
        })
      );
      act(() => result.current.onNotOwnedOnlyChange(false));
      expect(mockNavigate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ notOwnedOnly: undefined }),
        })
      );
    });
  });

  describe("switching status away from Want", () => {
    it("clears notOwnedOnly", () => {
      const { result } = renderHook(() =>
        useLibraryFiltersState({
          ...defaultInput,
          status: "WANT",
          notOwnedOnly: true,
        })
      );
      act(() => result.current.onStatusPick("DONE"));
      expect(mockNavigate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({
            status: "DONE",
            notOwnedOnly: undefined,
          }),
        })
      );
    });

    it("clears notOwnedOnly when showing all statuses", () => {
      const { result } = renderHook(() =>
        useLibraryFiltersState({
          ...defaultInput,
          status: "WANT",
          notOwnedOnly: true,
        })
      );
      act(() => result.current.onStatusAll());
      expect(mockNavigate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ notOwnedOnly: undefined }),
        })
      );
    });
  });

  describe("activeFilterCount with notOwnedOnly", () => {
    it("counts it alongside status", () => {
      const { result } = renderHook(() =>
        useLibraryFiltersState({
          ...defaultInput,
          status: "WANT",
          notOwnedOnly: true,
        })
      );
      expect(result.current.activeFilterCount).toBe(2);
    });
  });
});
