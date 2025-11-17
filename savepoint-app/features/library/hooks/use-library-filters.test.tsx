import { LibraryItemStatus } from "@prisma/client";
import { renderHook } from "@testing-library/react";
import { useSearchParams } from "next/navigation";

import { useLibraryFilters } from "./use-library-filters";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

const mockUseSearchParams = vi.mocked(useSearchParams);

const createMockSearchParams = (params: Record<string, string | null>) => {
  return {
    get: (key: string) => params[key] ?? null,
    has: (key: string) => key in params && params[key] !== null,
    getAll: (key: string) => (params[key] ? [params[key]!] : []),
    keys: () => Object.keys(params)[Symbol.iterator](),
    values: () => Object.values(params).filter(Boolean)[Symbol.iterator](),
    entries: () =>
      Object.entries(params)
        .filter(([, v]) => v !== null)
        [Symbol.iterator](),
    forEach: (callback: (value: string, key: string) => void) => {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null) callback(value, key);
      });
    },
    toString: () =>
      new URLSearchParams(params as Record<string, string>).toString(),
    size: Object.values(params).filter(Boolean).length,
    [Symbol.iterator]: () =>
      Object.entries(params)
        .filter(([, v]) => v !== null)
        [Symbol.iterator](),
  } as any;
};

describe("useLibraryFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given URL has no filter parameters", () => {
    it("should return default values when params are missing", () => {
      mockUseSearchParams.mockReturnValue(createMockSearchParams({}));

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current).toEqual({
        status: undefined,
        platform: undefined,
        search: undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
    });

    it("should default sortBy to createdAt", () => {
      mockUseSearchParams.mockReturnValue(createMockSearchParams({}));

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.sortBy).toBe("createdAt");
    });

    it("should default sortOrder to desc", () => {
      mockUseSearchParams.mockReturnValue(createMockSearchParams({}));

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.sortOrder).toBe("desc");
    });
  });

  describe("given URL has status parameter", () => {
    it("should parse CURIOUS_ABOUT status correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ status: LibraryItemStatus.CURIOUS_ABOUT })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);
    });

    it("should parse CURRENTLY_EXPLORING status correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);
    });

    it("should parse TOOK_A_BREAK status correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ status: LibraryItemStatus.TOOK_A_BREAK })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.status).toBe(LibraryItemStatus.TOOK_A_BREAK);
    });

    it("should parse EXPERIENCED status correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ status: LibraryItemStatus.EXPERIENCED })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.status).toBe(LibraryItemStatus.EXPERIENCED);
    });

    it("should parse WISHLIST status correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ status: LibraryItemStatus.WISHLIST })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.status).toBe(LibraryItemStatus.WISHLIST);
    });

    it("should parse REVISITING status correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ status: LibraryItemStatus.REVISITING })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.status).toBe(LibraryItemStatus.REVISITING);
    });

    it("should handle invalid status value gracefully", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ status: "INVALID_STATUS" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.status).toBe("INVALID_STATUS");
    });
  });

  describe("given URL has platform parameter", () => {
    it("should parse platform value correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ platform: "PlayStation 5" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.platform).toBe("PlayStation 5");
    });

    it("should handle URL-encoded platform names", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ platform: "Xbox Series X/S" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.platform).toBe("Xbox Series X/S");
    });

    it("should return undefined when platform is not set", () => {
      mockUseSearchParams.mockReturnValue(createMockSearchParams({}));

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.platform).toBeUndefined();
    });
  });

  describe("given URL has search parameter", () => {
    it("should parse search query correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ search: "zelda" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.search).toBe("zelda");
    });

    it("should handle search with spaces", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ search: "legend of zelda" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.search).toBe("legend of zelda");
    });

    it("should return undefined when search is not set", () => {
      mockUseSearchParams.mockReturnValue(createMockSearchParams({}));

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.search).toBeUndefined();
    });

    it("should handle empty search string", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ search: "" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.search).toBe("");
    });
  });

  describe("given URL has sortBy parameter", () => {
    it("should parse createdAt sort field", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ sortBy: "createdAt" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.sortBy).toBe("createdAt");
    });

    it("should parse releaseDate sort field", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ sortBy: "releaseDate" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.sortBy).toBe("releaseDate");
    });

    it("should parse startedAt sort field", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ sortBy: "startedAt" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.sortBy).toBe("startedAt");
    });

    it("should parse completedAt sort field", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ sortBy: "completedAt" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.sortBy).toBe("completedAt");
    });

    it("should default to createdAt for invalid sort field", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ sortBy: "invalidField" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.sortBy).toBe("createdAt");
    });
  });

  describe("given URL has sortOrder parameter", () => {
    it("should parse asc sort order", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ sortOrder: "asc" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.sortOrder).toBe("asc");
    });

    it("should parse desc sort order", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ sortOrder: "desc" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.sortOrder).toBe("desc");
    });

    it("should default to desc for invalid sort order", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({ sortOrder: "invalid" })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current.sortOrder).toBe("desc");
    });
  });

  describe("given URL has multiple filter parameters", () => {
    it("should parse all filters correctly", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          platform: "PlayStation 5",
          search: "zelda",
          sortBy: "releaseDate",
          sortOrder: "asc",
        })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current).toEqual({
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
        platform: "PlayStation 5",
        search: "zelda",
        sortBy: "releaseDate",
        sortOrder: "asc",
      });
    });

    it("should handle partial filter combinations", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          status: LibraryItemStatus.WISHLIST,
          sortBy: "completedAt",
        })
      );

      const { result } = renderHook(() => useLibraryFilters());

      expect(result.current).toEqual({
        status: LibraryItemStatus.WISHLIST,
        platform: undefined,
        search: undefined,
        sortBy: "completedAt",
        sortOrder: "desc",
      });
    });
  });

  describe("given hook behavior on re-render", () => {
    it("should update when search params change", () => {
      const initialParams = createMockSearchParams({
        status: LibraryItemStatus.WISHLIST,
      });
      mockUseSearchParams.mockReturnValue(initialParams);

      const { result, rerender } = renderHook(() => useLibraryFilters());

      expect(result.current.status).toBe(LibraryItemStatus.WISHLIST);

      const updatedParams = createMockSearchParams({
        status: LibraryItemStatus.EXPERIENCED,
      });
      mockUseSearchParams.mockReturnValue(updatedParams);

      rerender();

      expect(result.current.status).toBe(LibraryItemStatus.EXPERIENCED);
    });

    it("should handle transition from no filters to filters", () => {
      mockUseSearchParams.mockReturnValue(createMockSearchParams({}));

      const { result, rerender } = renderHook(() => useLibraryFilters());

      expect(result.current.status).toBeUndefined();
      expect(result.current.platform).toBeUndefined();

      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          status: LibraryItemStatus.CURIOUS_ABOUT,
          platform: "PC",
        })
      );

      rerender();

      expect(result.current.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);
      expect(result.current.platform).toBe("PC");
    });

    it("should handle clearing filters", () => {
      mockUseSearchParams.mockReturnValue(
        createMockSearchParams({
          status: LibraryItemStatus.EXPERIENCED,
          platform: "Nintendo Switch",
          search: "mario",
        })
      );

      const { result, rerender } = renderHook(() => useLibraryFilters());

      expect(result.current.status).toBe(LibraryItemStatus.EXPERIENCED);
      expect(result.current.platform).toBe("Nintendo Switch");
      expect(result.current.search).toBe("mario");

      mockUseSearchParams.mockReturnValue(createMockSearchParams({}));

      rerender();

      expect(result.current.status).toBeUndefined();
      expect(result.current.platform).toBeUndefined();
      expect(result.current.search).toBeUndefined();
      expect(result.current.sortBy).toBe("createdAt");
      expect(result.current.sortOrder).toBe("desc");
    });
  });
});
