import { createQueryWrapper } from "@/test/utils/test-provider";
import { renderHook, waitFor } from "@testing-library/react";

import { useGetCollection } from "./use-get-collection";

describe("useGetCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("given no filters are provided", () => {
    it("should fetch collection with default parameters", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ collection: [], count: 0 }),
      } as Response);

      const { result } = renderHook(() => useGetCollection(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data.collection).toEqual([]);
      expect(result.current.data.count).toBe(0);
      expect(global.fetch).toHaveBeenCalledWith("/api/collection?");
    });
  });

  describe("given search filter is provided", () => {
    it("should include search in query string", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ collection: [], count: 0 }),
      } as Response);

      const { result } = renderHook(
        () => useGetCollection({ search: "zelda", status: "", platform: "" }),
        {
          wrapper: createQueryWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/collection?search=zelda");
    });
  });

  describe("given status filter is provided", () => {
    it("should include status in query string", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ collection: [], count: 0 }),
      } as Response);

      const { result } = renderHook(
        () =>
          useGetCollection({
            search: "",
            status: "CURRENTLY_EXPLORING",
            platform: "",
          }),
        {
          wrapper: createQueryWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/collection?status=CURRENTLY_EXPLORING"
      );
    });
  });

  describe("given platform filter is provided", () => {
    it("should include platform in query string", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ collection: [], count: 0 }),
      } as Response);

      const { result } = renderHook(
        () =>
          useGetCollection({
            search: "",
            status: "",
            platform: "Nintendo Switch",
          }),
        {
          wrapper: createQueryWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/collection?platform=Nintendo+Switch"
      );
    });
  });

  describe("given page parameter is provided", () => {
    it("should include page in query string", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ collection: [], count: 0 }),
      } as Response);

      const { result } = renderHook(
        () =>
          useGetCollection({
            search: "",
            status: "",
            platform: "",
            page: 2,
          }),
        {
          wrapper: createQueryWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/collection?page=2");
    });
  });

  describe("given multiple filters are provided", () => {
    it("should include all filters in query string", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ collection: [], count: 0 }),
      } as Response);

      const { result } = renderHook(
        () =>
          useGetCollection({
            search: "zelda",
            status: "CURIOUS_ABOUT",
            platform: "PC",
            page: 3,
          }),
        {
          wrapper: createQueryWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/collection?platform=PC&status=CURIOUS_ABOUT&search=zelda&page=3"
      );
    });
  });

  describe("given API returns collection data", () => {
    it("should return collection items and count", async () => {
      const mockCollection = [
        {
          game: {
            id: "game-1",
            title: "The Legend of Zelda",
            igdbId: 1234,
            coverImage: "cover1",
            releaseDate: new Date("2017-03-03"),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          libraryItems: [
            {
              id: "item-1",
              userId: "user-1",
              gameId: "game-1",
              status: "CURRENTLY_EXPLORING" as const,
              platform: "Nintendo Switch",
              acquisitionType: "DIGITAL" as const,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ];

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ collection: mockCollection, count: 1 }),
      } as Response);

      const { result } = renderHook(() => useGetCollection(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data.collection).toEqual(mockCollection);
      expect(result.current.data.count).toBe(1);
    });
  });

  describe("given API returns empty collection", () => {
    it("should return empty array and zero count", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ collection: [], count: 0 }),
      } as Response);

      const { result } = renderHook(() => useGetCollection(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data.collection).toEqual([]);
      expect(result.current.data.count).toBe(0);
    });
  });

  describe("given API returns error", () => {
    it("should set error state with error message", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Failed to fetch collection" }),
      } as Response);

      const { result } = renderHook(() => useGetCollection(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.error).toBeTruthy();
        },
        { timeout: 5000 }
      );

      expect(result.current.data.collection).toEqual([]);
      expect(result.current.data.count).toBe(0);
    });
  });

  describe("given network error occurs", () => {
    it("should set error state", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useGetCollection(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.error).toBeTruthy();
        },
        { timeout: 5000 }
      );

      expect(result.current.data.collection).toEqual([]);
      expect(result.current.data.count).toBe(0);
    });
  });

  describe("given filters change", () => {
    it("should refetch with new filters", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ collection: [], count: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ collection: [], count: 5 }),
        } as Response);

      const { result, rerender } = renderHook(
        ({ filters }) => useGetCollection(filters),
        {
          wrapper: createQueryWrapper(),
          initialProps: {
            filters: { search: "zelda", status: "", platform: "" },
          },
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/collection?search=zelda");

      rerender({
        filters: { search: "mario", status: "", platform: "" },
      });

      await waitFor(() => {
        expect(result.current.data.count).toBe(5);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/collection?search=mario");
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("given refetch is called", () => {
    it("should refetch collection data", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ collection: [], count: 0 }),
      } as Response);

      const { result } = renderHook(() => useGetCollection(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      await result.current.refetch();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("given special characters in filters", () => {
    it("should properly URL encode filter values", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ collection: [], count: 0 }),
      } as Response);

      const { result } = renderHook(
        () =>
          useGetCollection({
            search: "Pokémon: Let's Go!",
            status: "",
            platform: "",
          }),
        {
          wrapper: createQueryWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("Pok%C3%A9mon")
      );
    });
  });

  describe("given isFetching state", () => {
    it("should expose isFetching as true during fetch", async () => {
      vi.mocked(global.fetch).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ collection: [], count: 0 }),
                } as Response),
              100
            )
          )
      );

      const { result } = renderHook(() => useGetCollection(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.isFetching).toBe(true);

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });
    });
  });

  describe("given empty string filters", () => {
    it("should not include empty filters in query string", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ collection: [], count: 0 }),
      } as Response);

      const { result } = renderHook(
        () =>
          useGetCollection({
            search: "",
            status: "",
            platform: "",
          }),
        {
          wrapper: createQueryWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/collection?");
    });
  });
});
