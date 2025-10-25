import { createQueryWrapper } from "@/test/utils/test-provider";
import { renderHook, waitFor } from "@testing-library/react";

import { useSearchGamesByName } from "./use-search-games-by-name";

describe("useSearchGamesByName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should not fetch when query is empty", () => {
    const { result } = renderHook(() => useSearchGamesByName(""), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.games).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should not fetch when query is less than 3 characters", () => {
    const { result } = renderHook(() => useSearchGamesByName("ab"), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.games).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should trim query before validation", () => {
    const { result } = renderHook(() => useSearchGamesByName("  ab  "), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.games).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should fetch when query is 3 or more characters", async () => {
    const mockGames = [
      {
        id: 1,
        name: "The Legend of Zelda",
        cover: { image_id: "cover1" },
      },
      {
        id: 2,
        name: "Zelda: Breath of the Wild",
        cover: { image_id: "cover2" },
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ games: mockGames }),
    } as Response);

    const { result } = renderHook(() => useSearchGamesByName("zelda"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.games).toEqual(mockGames);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBe(null);
    expect(global.fetch).toHaveBeenCalledWith("/api/search?query=zelda");
  });

  it("should handle fetch errors with error message from API", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "IGDB API is unavailable" }),
    } as Response);

    const { result } = renderHook(() => useSearchGamesByName("zelda"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 }
    );

    expect(result.current.games).toEqual([]);
    expect(result.current.error?.message).toBe("IGDB API is unavailable");
  });

  it("should handle fetch errors without error message", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    const { result } = renderHook(() => useSearchGamesByName("zelda"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 }
    );

    expect(result.current.games).toEqual([]);
    expect(result.current.error?.message).toBe("Failed to search games");
  });

  it("should handle network errors", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSearchGamesByName("zelda"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 }
    );

    expect(result.current.games).toEqual([]);
    expect(result.current.error?.message).toBe("Network error");
  });

  it("should return empty array when API returns no games", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    } as Response);

    const { result } = renderHook(() => useSearchGamesByName("zzzzz"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.games).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it("should update query when rerendered with new value", async () => {
    const mockZeldaGames = [
      { id: 1, name: "Zelda", cover: { image_id: "cover1" } },
    ];
    const mockMarioGames = [
      { id: 2, name: "Mario", cover: { image_id: "cover2" } },
    ];

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: mockZeldaGames }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: mockMarioGames }),
      } as Response);

    const { result, rerender } = renderHook(
      ({ query }) => useSearchGamesByName(query),
      {
        wrapper: createQueryWrapper(),
        initialProps: { query: "zelda" },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.games).toEqual(mockZeldaGames);

    rerender({ query: "mario" });

    await waitFor(() => {
      expect(result.current.games).toEqual(mockMarioGames);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/search?query=zelda");
    expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/search?query=mario");
  });

  it("should handle queries with special characters", async () => {
    const mockGames = [
      { id: 1, name: "Pokémon", cover: { image_id: "cover1" } },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ games: mockGames }),
    } as Response);

    const { result } = renderHook(
      () => useSearchGamesByName("Pokémon: Let's Go!"),
      {
        wrapper: createQueryWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.games).toEqual(mockGames);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/search?query=Pok%C3%A9mon%3A+Let%27s+Go%21"
    );
  });

  it("should expose isFetching state", async () => {
    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ games: [] }),
              } as Response),
            100
          )
        )
    );

    const { result } = renderHook(() => useSearchGamesByName("zelda"), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isFetching).toBe(true);

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });
  });

  it("should handle query with exactly 3 characters", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    } as Response);

    const { result } = renderHook(() => useSearchGamesByName("abc"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/search?query=abc");
  });

  it("should handle whitespace-only query as invalid", () => {
    const { result } = renderHook(() => useSearchGamesByName("   "), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.games).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should fetch when valid query after trimming whitespace", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    } as Response);

    const { result } = renderHook(() => useSearchGamesByName("  zelda  "), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/search?query=zelda");
  });
});
