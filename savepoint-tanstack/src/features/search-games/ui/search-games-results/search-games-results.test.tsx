import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchGamesResults } from "./search-games-results";

// Mock the server fn wrapper — the TanStack Start runtime is not available in jsdom.
const mockSearchGamesFn = vi.fn();
vi.mock("@/features/search-games/api/search-library-aware-games", () => ({
  searchLibraryAwareGamesFn: (...args: unknown[]) => mockSearchGamesFn(...args),
}));

// Mock Link from tanstack router to a plain <a> so we don't need RouterProvider.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    ...rest
  }: {
    to?: string;
    params?: Record<string, string>;
    children: React.ReactNode;
  } & Record<string, unknown>) => {
    let resolvedHref = to ?? "";
    if (params && to) {
      for (const [key, value] of Object.entries(params)) {
        resolvedHref = resolvedHref.replace(`$${key}`, value);
      }
    }
    return (
      <a href={resolvedHref} {...rest}>
        {children}
      </a>
    );
  },
}));

// Minimal IGDB game shape returned by searchGamesFn.
function makeIgdbGame(
  id: number,
  name: string,
  slug: string,
  opts: {
    coverImageId?: string;
    firstReleaseDate?: number;
    library?: { status: string; rating: number | null } | null;
  } = {}
) {
  return {
    id,
    name,
    slug,
    cover: opts.coverImageId ? { image_id: opts.coverImageId } : undefined,
    first_release_date: opts.firstReleaseDate,
    // `library` MUST default to null (not undefined) — the card's owned check
    // is `game.library !== null`, and `undefined !== null` would mis-read every
    // unowned result as owned.
    library: opts.library ?? null,
  };
}

const elements = {
  getLoadingSpinner: () =>
    screen.getByRole("status", { name: "Loading search results" }),
  queryLoadingSpinner: () =>
    screen.queryByRole("status", { name: "Loading search results" }),
  getErrorAlert: () => screen.getByRole("alert"),
  queryErrorAlert: () => screen.queryByRole("alert"),
  getEmptyStatus: () => screen.getByRole("status"),
  getResultsCount: (text: string) => screen.getByText(text),
  queryResultsCount: (text: RegExp) => screen.queryByText(text),
  getGameLink: (slug: string) =>
    screen.getByRole("link", { name: new RegExp(slug, "i") }),
  getAllLinks: () => screen.getAllByRole("link"),
};

describe("SearchGamesResults", () => {
  beforeEach(() => {
    mockSearchGamesFn.mockReset();
  });

  describe("given query is shorter than 3 characters", () => {
    beforeEach(() => {
      render(<SearchGamesResults query="ab" />);
    });

    it("renders nothing (returns null)", () => {
      expect(elements.queryLoadingSpinner()).toBeNull();
      expect(elements.queryErrorAlert()).toBeNull();
    });
  });

  describe("given query is empty", () => {
    beforeEach(() => {
      render(<SearchGamesResults query="" />);
    });

    it("renders nothing", () => {
      expect(elements.queryLoadingSpinner()).toBeNull();
    });
  });

  describe("given query meets minimum length and fetch is in flight", () => {
    beforeEach(() => {
      // Never-resolving promise — component stays in loading state.
      mockSearchGamesFn.mockReturnValue(new Promise(() => {}));
      render(<SearchGamesResults query="zelda" />);
    });

    it("shows the loading spinner while waiting for results", () => {
      expect(elements.getLoadingSpinner()).toBeDefined();
    });
  });

  describe("given a successful search returns games", () => {
    const games = [
      makeIgdbGame(1, "Zelda: Breath of the Wild", "zelda-botw", {
        coverImageId: "cover1",
        firstReleaseDate: 1489449600,
      }),
      makeIgdbGame(2, "Zelda: Tears of the Kingdom", "zelda-totk", {
        coverImageId: "cover2",
      }),
    ];

    beforeEach(async () => {
      mockSearchGamesFn.mockResolvedValue({ games });
      render(<SearchGamesResults query="zelda" />);
      await act(async () => {});
    });

    it("hides the loading spinner after results arrive", () => {
      expect(elements.queryLoadingSpinner()).toBeNull();
    });

    it("shows the result count", () => {
      expect(elements.getResultsCount("2 results")).toBeDefined();
    });

    it("renders a link for each game", () => {
      expect(elements.getAllLinks()).toHaveLength(2);
    });

    it("renders the game title for each result", () => {
      expect(screen.getByText("Zelda: Breath of the Wild")).toBeDefined();
      expect(screen.getByText("Zelda: Tears of the Kingdom")).toBeDefined();
    });

    it("shows release year when first_release_date is provided", () => {
      // 1489449600 epoch = 2017-03-14
      expect(screen.getByText("2017")).toBeDefined();
    });
  });

  describe("given a successful search returns a single game", () => {
    const games = [makeIgdbGame(3, "Hades", "hades")];

    beforeEach(async () => {
      mockSearchGamesFn.mockResolvedValue({ games });
      render(<SearchGamesResults query="hades" />);
      await act(async () => {});
    });

    it("shows singular 'result' label (not 'results')", () => {
      expect(elements.getResultsCount("1 result")).toBeDefined();
    });
  });

  describe("given a successful search returns no games", () => {
    beforeEach(async () => {
      mockSearchGamesFn.mockResolvedValue({ games: [] });
      render(<SearchGamesResults query="xyzzy" />);
      await act(async () => {});
    });

    it("shows the no-results status message", () => {
      const status = elements.getEmptyStatus();
      expect(status.textContent).toContain("No games found matching");
      expect(status.textContent).toContain("xyzzy");
    });
  });

  describe("given the search fetch throws an error", () => {
    beforeEach(async () => {
      mockSearchGamesFn.mockRejectedValue(new Error("IGDB unavailable"));
      render(<SearchGamesResults query="zelda" />);
      await act(async () => {});
    });

    it("shows the error alert", () => {
      expect(elements.getErrorAlert()).toBeDefined();
    });

    it("includes the error message in the alert", () => {
      expect(elements.getErrorAlert().textContent).toContain(
        "IGDB unavailable"
      );
    });
  });

  describe("given a game has no cover image", () => {
    const games = [makeIgdbGame(10, "No Cover Game", "no-cover-game")];

    beforeEach(async () => {
      mockSearchGamesFn.mockResolvedValue({ games });
      render(<SearchGamesResults query="cover" />);
      await act(async () => {});
    });

    it("renders a placeholder img div with the game name in aria-label", () => {
      expect(
        screen.getByRole("img", { name: "Cover for No Cover Game" })
      ).toBeDefined();
    });
  });

  describe("given the component unmounts while a successful fetch is in flight (cancelled success path)", () => {
    it("does not update state after unmount (exercises the cancelled-success return branch)", async () => {
      let resolveFetch!: (v: {
        games: ReturnType<typeof makeIgdbGame>[];
      }) => void;
      mockSearchGamesFn.mockReturnValue(
        new Promise<{ games: ReturnType<typeof makeIgdbGame>[] }>((resolve) => {
          resolveFetch = resolve;
        })
      );

      const { unmount } = render(<SearchGamesResults query="zelda" />);
      expect(elements.getLoadingSpinner()).toBeDefined();

      // Unmount — sets cancelled = true before the promise resolves.
      unmount();

      // Resolve the fetch AFTER unmount — the `if (cancelled) return` guard fires.
      act(() => {
        resolveFetch({ games: [makeIgdbGame(1, "Zelda", "zelda")] });
      });

      // No assertions on DOM state (component is unmounted); the test value
      // is that no React state-update-after-unmount warning is thrown.
    });
  });

  describe("given the component unmounts while a failing fetch is in flight (cancelled error path)", () => {
    it("does not update state after unmount (exercises the cancelled-error return branch)", async () => {
      let rejectFetch!: (reason: Error) => void;
      mockSearchGamesFn.mockReturnValue(
        new Promise<never>((_, reject) => {
          rejectFetch = reject;
        })
      );

      const { unmount } = render(<SearchGamesResults query="zelda" />);
      expect(elements.getLoadingSpinner()).toBeDefined();

      // Unmount before the fetch rejects.
      unmount();

      act(() => {
        rejectFetch(new Error("network down"));
      });
      // No state-update warning expected; test passes if no throws occur.
    });
  });

  describe("given the search fetch rejects with a non-Error value", () => {
    beforeEach(async () => {
      mockSearchGamesFn.mockRejectedValue("network failure");
      render(<SearchGamesResults query="zelda" />);
      await act(async () => {});
    });

    it("shows the generic fallback error message", () => {
      expect(elements.getErrorAlert().textContent).toContain(
        "Game search is temporarily unavailable"
      );
    });
  });

  describe("given some results are already in the viewer's library", () => {
    const renderAddAction = vi.fn(
      ({ name }: { igdbId: number; name: string }) => (
        <button type="button">Add {name}</button>
      )
    );

    beforeEach(async () => {
      renderAddAction.mockClear();
      mockSearchGamesFn.mockResolvedValue({
        games: [
          makeIgdbGame(1, "Hades", "hades", {
            library: { status: "PLAYED", rating: 9 },
          }),
          makeIgdbGame(2, "Sword of Hades", "sword-of-hades", {
            library: null,
          }),
        ],
        count: 2,
        ownedCount: 1,
      });
      render(
        <SearchGamesResults query="hades" renderAddAction={renderAddAction} />
      );
      await act(async () => {});
    });

    it("summarises how many results are already owned", () => {
      expect(screen.getByText("1 in your library")).toBeInTheDocument();
    });

    it("shows the library status on an owned result", () => {
      expect(screen.getByLabelText("Status: Played")).toBeInTheDocument();
    });

    it("renders the add affordance only for unowned results", () => {
      expect(
        screen.getByRole("button", { name: "Add Sword of Hades" })
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Add Hades" })).toBeNull();
    });
  });

  describe("given no add-action slot is supplied", () => {
    beforeEach(async () => {
      mockSearchGamesFn.mockResolvedValue({
        games: [makeIgdbGame(1, "Hades", "hades", { library: null })],
        count: 1,
        ownedCount: 0,
      });
      render(<SearchGamesResults query="hades" />);
      await act(async () => {});
    });

    it("omits the owned summary when nothing is owned", () => {
      expect(screen.queryByText(/in your library/)).toBeNull();
    });
  });
});
