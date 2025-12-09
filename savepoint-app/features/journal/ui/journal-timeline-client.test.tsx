import { renderWithTestProviders } from "@/test/utils/test-provider";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  JournalVisibility,
  type JournalEntryDomain,
} from "@/shared/types/journal";

import { getGamesByIdsAction } from "../server-actions/get-games-by-ids";
import { getJournalEntriesAction } from "../server-actions/get-journal-entries";
import { JournalTimelineClient } from "./journal-timeline-client";

vi.mock("../server-actions/get-journal-entries", () => ({
  getJournalEntriesAction: vi.fn(),
}));

vi.mock("../server-actions/get-games-by-ids", () => ({
  getGamesByIdsAction: vi.fn(),
}));

vi.mock("./journal-entry-card", () => ({
  JournalEntryCard: ({
    entry,
    game,
  }: {
    entry: JournalEntryDomain;
    game: {
      id: string;
      title: string;
      slug: string;
      coverImage: string | null;
    };
  }) => (
    <div data-testid={`journal-entry-card-${entry.id}`}>
      {entry.title || "Untitled Entry"} - {game.title}
    </div>
  ),
}));

const mockGetJournalEntriesAction = vi.mocked(getJournalEntriesAction);
const mockGetGamesByIdsAction = vi.mocked(getGamesByIdsAction);

const createMockEntry = (
  overrides: Partial<JournalEntryDomain> = {}
): JournalEntryDomain => ({
  id: "entry-1",
  userId: "user-1",
  gameId: "game-1",
  libraryItemId: null,
  title: "My First Entry",
  content: "This is my journal entry content.",
  mood: null,
  playSession: null,
  visibility: JournalVisibility.PRIVATE,
  createdAt: new Date("2025-01-27T12:00:00Z"),
  updatedAt: new Date("2025-01-27T12:00:00Z"),
  publishedAt: null,
  ...overrides,
});

const createMockGame = (
  id: string,
  overrides: Partial<{
    title: string;
    slug: string;
    coverImage: string | null;
  }> = {}
) => ({
  id,
  title: `Game ${id}`,
  slug: `game-${id}`,
  coverImage: `cover-${id}`,
  ...overrides,
});

const elements = {
  getLoadMoreButton: () => screen.queryByRole("button", { name: /load more/i }),
  getLoadingSpinner: () => screen.queryByText(/loading/i),
  getEntryCards: () => screen.queryAllByTestId(/journal-entry-card-/),
  getTimelineHeader: () => screen.queryByText("Journal Entries"),
  getEmptyStateTitle: () => screen.queryByText("No journal entries yet"),
};

describe("JournalTimelineClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given initial entries with more available", () => {
    const initialEntries = Array.from({ length: 20 }, (_, i) =>
      createMockEntry({
        id: `entry-${i + 1}`,
        title: `Entry ${i + 1}`,
        gameId: `game-${i + 1}`,
      })
    );

    const initialGames = new Map(
      initialEntries.map((entry) => [
        entry.gameId,
        createMockGame(entry.gameId, { title: `Game ${entry.gameId}` }),
      ])
    );

    beforeEach(() => {
      renderWithTestProviders(
        <JournalTimelineClient
          initialEntries={initialEntries}
          initialGames={initialGames}
        />
      );
    });

    it("should display all initial entries", () => {
      expect(elements.getEntryCards()).toHaveLength(20);
    });

    it("should display 'Load More' button", () => {
      expect(elements.getLoadMoreButton()).toBeVisible();
      expect(elements.getLoadMoreButton()).not.toBeDisabled();
    });

    describe("when clicking 'Load More' button", () => {
      it("should call getJournalEntriesAction with cursor from last entry", async () => {
        const nextPageEntries = Array.from({ length: 20 }, (_, i) =>
          createMockEntry({
            id: `entry-${i + 21}`,
            title: `Entry ${i + 21}`,
            gameId: `game-${i + 21}`,
          })
        );

        mockGetJournalEntriesAction.mockResolvedValue({
          success: true,
          data: nextPageEntries,
        });

        mockGetGamesByIdsAction.mockResolvedValue({
          success: true,
          data: nextPageEntries.map((entry) =>
            createMockGame(entry.gameId, { title: `Game ${entry.gameId}` })
          ),
        });

        await userEvent.click(elements.getLoadMoreButton()!);

        await waitFor(() => {
          expect(mockGetJournalEntriesAction).toHaveBeenCalledWith({
            cursor: "entry-20",
            limit: 20,
          });
        });
      });

      it("should show loading state during fetch", async () => {
        let resolvePromise: (value: any) => void;
        const promise = new Promise((resolve) => {
          resolvePromise = resolve;
        });

        mockGetJournalEntriesAction.mockReturnValue(promise as any);
        mockGetGamesByIdsAction.mockResolvedValue({
          success: true,
          data: [],
        });

        await userEvent.click(elements.getLoadMoreButton()!);

        await waitFor(() => {
          expect(elements.getLoadingSpinner()).toBeVisible();
        });

        resolvePromise!({
          success: true,
          data: [],
        });

        await waitFor(() => {
          expect(elements.getLoadingSpinner()).not.toBeInTheDocument();
        });
      });

      it("should append new entries to existing list", async () => {
        const nextPageEntries = Array.from({ length: 15 }, (_, i) =>
          createMockEntry({
            id: `entry-${i + 21}`,
            title: `Entry ${i + 21}`,
            gameId: `game-${i + 21}`,
          })
        );

        mockGetJournalEntriesAction.mockResolvedValue({
          success: true,
          data: nextPageEntries,
        });

        mockGetGamesByIdsAction.mockResolvedValue({
          success: true,
          data: nextPageEntries.map((entry) =>
            createMockGame(entry.gameId, { title: `Game ${entry.gameId}` })
          ),
        });

        await userEvent.click(elements.getLoadMoreButton()!);

        await waitFor(() => {
          expect(elements.getEntryCards()).toHaveLength(35);
        });
      });

      it("should fetch games for new entries", async () => {
        const nextPageEntries = Array.from({ length: 5 }, (_, i) =>
          createMockEntry({
            id: `entry-${i + 21}`,
            title: `Entry ${i + 21}`,
            gameId: `game-${i + 21}`,
          })
        );

        mockGetJournalEntriesAction.mockResolvedValue({
          success: true,
          data: nextPageEntries,
        });

        const newGames = nextPageEntries.map((entry) =>
          createMockGame(entry.gameId, { title: `Game ${entry.gameId}` })
        );

        mockGetGamesByIdsAction.mockResolvedValue({
          success: true,
          data: newGames,
        });

        await userEvent.click(elements.getLoadMoreButton()!);

        await waitFor(() => {
          expect(mockGetGamesByIdsAction).toHaveBeenCalledWith({
            gameIds: ["game-21", "game-22", "game-23", "game-24", "game-25"],
          });
        });
      });

      it("should disable button during loading", async () => {
        let resolvePromise: (value: any) => void;
        const promise = new Promise((resolve) => {
          resolvePromise = resolve;
        });

        mockGetJournalEntriesAction.mockReturnValue(promise as any);
        mockGetGamesByIdsAction.mockResolvedValue({
          success: true,
          data: [],
        });

        const button = elements.getLoadMoreButton()!;
        expect(button).not.toBeDisabled();

        await userEvent.click(button);

        // Button should be disabled during loading
        await waitFor(() => {
          const loadingButton = screen.queryByRole("button", {
            name: /loading/i,
          });
          expect(loadingButton).toBeDisabled();
        });

        resolvePromise!({
          success: true,
          data: [],
        });

        // After loading completes, button should be enabled again (or hidden if no more entries)
        await waitFor(() => {
          const buttonAfter = elements.getLoadMoreButton();
          if (buttonAfter) {
            expect(buttonAfter).not.toBeDisabled();
          }
        });
      });
    });
  });

  describe("given initial entries with no more available", () => {
    const initialEntries = Array.from({ length: 15 }, (_, i) =>
      createMockEntry({
        id: `entry-${i + 1}`,
        title: `Entry ${i + 1}`,
        gameId: `game-${i + 1}`,
      })
    );

    const initialGames = new Map(
      initialEntries.map((entry) => [
        entry.gameId,
        createMockGame(entry.gameId, { title: `Game ${entry.gameId}` }),
      ])
    );

    beforeEach(() => {
      renderWithTestProviders(
        <JournalTimelineClient
          initialEntries={initialEntries}
          initialGames={initialGames}
        />
      );
    });

    it("should not display 'Load More' button", () => {
      expect(elements.getLoadMoreButton()).not.toBeInTheDocument();
    });
  });

  describe("given entries become exhausted after loading more", () => {
    const initialEntries = Array.from({ length: 20 }, (_, i) =>
      createMockEntry({
        id: `entry-${i + 1}`,
        title: `Entry ${i + 1}`,
        gameId: `game-${i + 1}`,
      })
    );

    const initialGames = new Map(
      initialEntries.map((entry) => [
        entry.gameId,
        createMockGame(entry.gameId, { title: `Game ${entry.gameId}` }),
      ])
    );

    beforeEach(() => {
      renderWithTestProviders(
        <JournalTimelineClient
          initialEntries={initialEntries}
          initialGames={initialGames}
        />
      );
    });

    it("should hide 'Load More' button when fewer than limit entries returned", async () => {
      const nextPageEntries = Array.from({ length: 10 }, (_, i) =>
        createMockEntry({
          id: `entry-${i + 21}`,
          title: `Entry ${i + 21}`,
          gameId: `game-${i + 21}`,
        })
      );

      mockGetJournalEntriesAction.mockResolvedValue({
        success: true,
        data: nextPageEntries,
      });

      mockGetGamesByIdsAction.mockResolvedValue({
        success: true,
        data: nextPageEntries.map((entry) =>
          createMockGame(entry.gameId, { title: `Game ${entry.gameId}` })
        ),
      });

      expect(elements.getLoadMoreButton()).toBeVisible();

      await userEvent.click(elements.getLoadMoreButton()!);

      await waitFor(() => {
        expect(elements.getLoadMoreButton()).not.toBeInTheDocument();
      });
    });
  });

  describe("given empty initial entries", () => {
    beforeEach(() => {
      renderWithTestProviders(
        <JournalTimelineClient initialEntries={[]} initialGames={new Map()} />
      );
    });

    it("should display empty state", () => {
      expect(elements.getEmptyStateTitle()).toBeVisible();
    });

    it("should not display 'Load More' button", () => {
      expect(elements.getLoadMoreButton()).not.toBeInTheDocument();
    });

    it("should not display timeline header", () => {
      expect(elements.getTimelineHeader()).not.toBeInTheDocument();
    });
  });

  describe("given server action fails", () => {
    const initialEntries = Array.from({ length: 20 }, (_, i) =>
      createMockEntry({
        id: `entry-${i + 1}`,
        title: `Entry ${i + 1}`,
        gameId: `game-${i + 1}`,
      })
    );

    const initialGames = new Map(
      initialEntries.map((entry) => [
        entry.gameId,
        createMockGame(entry.gameId, { title: `Game ${entry.gameId}` }),
      ])
    );

    beforeEach(() => {
      renderWithTestProviders(
        <JournalTimelineClient
          initialEntries={initialEntries}
          initialGames={initialGames}
        />
      );
    });

    it("should not append entries when fetch fails", async () => {
      mockGetJournalEntriesAction.mockResolvedValue({
        success: false,
        error: "Failed to fetch entries",
      });

      const initialCount = elements.getEntryCards().length;

      await userEvent.click(elements.getLoadMoreButton()!);

      await waitFor(() => {
        expect(elements.getEntryCards()).toHaveLength(initialCount);
      });
    });

    it("should allow retry after failed fetch", async () => {
      mockGetJournalEntriesAction
        .mockResolvedValueOnce({
          success: false,
          error: "Failed to fetch entries",
        })
        .mockResolvedValueOnce({
          success: true,
          data: [],
        });

      const button = elements.getLoadMoreButton()!;

      // First click - fails
      await userEvent.click(button);
      await waitFor(() => {
        expect(mockGetJournalEntriesAction).toHaveBeenCalledTimes(1);
      });

      // Wait for transition to complete
      await waitFor(() => {
        const buttonAfter = elements.getLoadMoreButton();
        // Button should still be visible and clickable after failure
        expect(buttonAfter).toBeInTheDocument();
      });

      // Second click - should work (button should be clickable)
      const buttonAfterFailure = elements.getLoadMoreButton()!;
      await userEvent.click(buttonAfterFailure);
      await waitFor(() => {
        expect(mockGetJournalEntriesAction).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("given games fetch fails", () => {
    const initialEntries = Array.from({ length: 20 }, (_, i) =>
      createMockEntry({
        id: `entry-${i + 1}`,
        title: `Entry ${i + 1}`,
        gameId: `game-${i + 1}`,
      })
    );

    const initialGames = new Map(
      initialEntries.map((entry) => [
        entry.gameId,
        createMockGame(entry.gameId, { title: `Game ${entry.gameId}` }),
      ])
    );

    beforeEach(() => {
      renderWithTestProviders(
        <JournalTimelineClient
          initialEntries={initialEntries}
          initialGames={initialGames}
        />
      );
    });

    it("should append entries but skip rendering if games fetch fails", async () => {
      const nextPageEntries = Array.from({ length: 5 }, (_, i) =>
        createMockEntry({
          id: `entry-${i + 21}`,
          title: `Entry ${i + 21}`,
          gameId: `game-${i + 21}`,
        })
      );

      mockGetJournalEntriesAction.mockResolvedValue({
        success: true,
        data: nextPageEntries,
      });

      mockGetGamesByIdsAction.mockResolvedValue({
        success: false,
        error: "Failed to fetch games",
      });

      await userEvent.click(elements.getLoadMoreButton()!);

      // Wait for entries to be fetched
      await waitFor(() => {
        expect(mockGetJournalEntriesAction).toHaveBeenCalled();
      });

      // Wait for games fetch attempt
      await waitFor(() => {
        expect(mockGetGamesByIdsAction).toHaveBeenCalled();
      });

      // Entries are added to state, but cards aren't rendered because games are missing
      // The component skips entries with missing games (see journal-timeline-client.tsx line 104-107)
      await waitFor(() => {
        // Entries are in state but not rendered since games are missing
        expect(elements.getEntryCards()).toHaveLength(20);
      });
    });
  });
});
