/**
 * Component tests for LogSessionGamePicker (Spec 025 Slice 3b).
 *
 * CONTRACT
 * - renders a list of the user's library games (loaded via a server fn).
 * - when the user selects a game, calls onSelect(slug).
 * - shows a loading state while the library data is pending.
 *
 * TODO (GREEN step): confirm the exact server fn module path and adjust the mock below.
 * Placeholder path: "@/features/library-list/api/get-library-page-data"
 * The GREEN agent should verify this path matches the real fn used in the component
 * (may reuse getLibraryPageDataFn or a lighter dedicated fn) and update accordingly.
 *
 * NOT tested: search/filter internals beyond what is user-observable.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LogSessionGamePicker } from "./log-session-game-picker";

// ---------------------------------------------------------------------------
// Library data fn mock
// Path: "@/features/compose-journal-entry/api/get-loggable-games"
// ---------------------------------------------------------------------------

const { mockGetLibraryPageData } = vi.hoisted(() => ({
  mockGetLibraryPageData: vi.fn(),
}));

vi.mock("@/features/compose-journal-entry/api/get-loggable-games", () => ({
  getLoggableGamesFn: mockGetLibraryPageData,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_LIBRARY_ITEMS = [
  {
    id: "item-1",
    userId: "user-1",
    gameId: "game-1",
    status: "PLAYING" as const,
    platform: null,
    acquisitionType: null,
    rating: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    game: {
      id: "game-1",
      igdbId: 1001,
      title: "Hollow Knight",
      slug: "hollow-knight",
      coverImage: null,
      releaseDate: null,
    },
  },
  {
    id: "item-2",
    userId: "user-1",
    gameId: "game-2",
    status: "UP_NEXT" as const,
    platform: null,
    acquisitionType: null,
    rating: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    game: {
      id: "game-2",
      igdbId: 1002,
      title: "Celeste",
      slug: "celeste",
      coverImage: null,
      releaseDate: null,
    },
  },
];

const MOCK_LIBRARY_RESULT = {
  items: MOCK_LIBRARY_ITEMS,
  total: 2,
};

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  queryLoadingState: () =>
    screen.queryByTestId("log-session-game-picker-loading"),
  queryGameItem: (title: string) =>
    screen.queryByRole("button", { name: title }),
  getGameItem: (title: string) => screen.getByRole("button", { name: title }),
};

// ---------------------------------------------------------------------------
// Action vocabulary
// ---------------------------------------------------------------------------

const actions = {
  selectGame: async (title: string) => {
    await userEvent.click(elements.getGameItem(title));
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LogSessionGamePicker", () => {
  describe("while library data is loading", () => {
    beforeEach(() => {
      mockGetLibraryPageData.mockReturnValue(new Promise(() => {}));
      render(<LogSessionGamePicker onSelect={vi.fn()} />);
    });

    it("shows a loading state", () => {
      expect(elements.queryLoadingState()).toBeDefined();
    });

    it("does not render any game items yet", () => {
      expect(elements.queryGameItem("Hollow Knight")).toBeNull();
    });
  });

  describe("once library data resolves", () => {
    let mockOnSelect: (slug: string) => void;

    beforeEach(async () => {
      mockOnSelect = vi.fn();
      mockGetLibraryPageData.mockResolvedValue(MOCK_LIBRARY_RESULT);
      render(<LogSessionGamePicker onSelect={mockOnSelect} />);
      await waitFor(() => {
        expect(elements.queryGameItem("Hollow Knight")).not.toBeNull();
      });
    });

    it("renders a list of the user's library games", () => {
      expect(elements.getGameItem("Hollow Knight")).toBeDefined();
      expect(elements.getGameItem("Celeste")).toBeDefined();
    });

    describe("when the user selects a game", () => {
      beforeEach(async () => {
        await actions.selectGame("Hollow Knight");
      });

      it("calls onSelect with the game slug", () => {
        expect(mockOnSelect).toHaveBeenCalledWith("hollow-knight");
      });

      it("calls onSelect exactly once", () => {
        expect(mockOnSelect).toHaveBeenCalledTimes(1);
      });
    });

    describe("when the user selects a different game", () => {
      beforeEach(async () => {
        await actions.selectGame("Celeste");
      });

      it("calls onSelect with that game's slug", () => {
        expect(mockOnSelect).toHaveBeenCalledWith("celeste");
      });
    });
  });
});
