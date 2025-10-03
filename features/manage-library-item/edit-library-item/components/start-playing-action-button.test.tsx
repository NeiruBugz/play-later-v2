import { renderWithTestProviders } from "@/test/utils/test-provider";
import { LibraryItemStatus } from "@prisma/client";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateLibraryItemAction } from "../hooks/update-library-action";
import { useMatchingLibraryItem } from "../hooks/use-matching-library-item";
import { StartPlayingActionButton } from "./start-playing-action-button";

// Mock the dependencies
vi.mock("../hooks/update-library-action", () => ({
  updateLibraryItemAction: vi.fn(),
}));

vi.mock("../hooks/use-matching-library-item", () => ({
  useMatchingLibraryItem: vi.fn(),
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}));

// Get the mocked functions
const mockUpdateBacklogItemAction = vi.mocked(updateLibraryItemAction);
const mockUseMatchingBacklogItem = vi.mocked(useMatchingLibraryItem);

const elements = {
  getStartPlayingButton: () => screen.getByRole("button"),
  queryStartPlayingButton: () => screen.queryByRole("button"),
  getPlayIcon: () => screen.getByRole("button").querySelector("svg"),
};

const actions = {
  clickStartPlayingButton: async () => {
    const user = userEvent.setup();
    const button = elements.getStartPlayingButton();
    await user.click(button);
  },
};

describe("StartPlayingActionButton", () => {
  const mockGame = {
    id: "game-1",
    title: "Test Game",
    coverImage: "https://example.com/cover.jpg",
  };

  const mockLibraryItem = {
    id: 1,
    userId: "user-1",
    gameId: "game-1",
    platform: "PC",
    status: LibraryItemStatus.CURIOUS_ABOUT,
    acquisitionType: "DIGITAL" as const,
    startedAt: null,
    completedAt: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("when backlog item can be started playing", () => {
    beforeEach(() => {
      // Arrange: Mock returns a CURIOUS_ABOUT item that can be started
      mockUseMatchingBacklogItem.mockReturnValue(mockLibraryItem);
    });

    it("should render the start playing button", () => {
      // Act
      renderWithTestProviders(
        <StartPlayingActionButton
          game={mockGame}
          libraryItems={[mockLibraryItem]}
        />
      );

      // Assert
      expect(elements.getStartPlayingButton()).toBeInTheDocument();
      expect(elements.getPlayIcon()).toBeInTheDocument();
    });

    it("should call updateLibraryItemAction when clicked", async () => {
      // Arrange
      mockUpdateBacklogItemAction.mockResolvedValue({ data: undefined });
      renderWithTestProviders(
        <StartPlayingActionButton
          game={mockGame}
          libraryItems={[mockLibraryItem]}
        />
      );

      // Act
      await actions.clickStartPlayingButton();

      // Assert
      expect(mockUpdateBacklogItemAction).toHaveBeenCalledWith({
        id: 1,
        status: "CURRENTLY_EXPLORING",
      });
    });

    it("should handle server action errors gracefully", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error");
      const error = new Error("Network error");
      mockUpdateBacklogItemAction.mockRejectedValue(error);
      renderWithTestProviders(
        <StartPlayingActionButton
          game={mockGame}
          libraryItems={[mockLibraryItem]}
        />
      );

      // Act
      await actions.clickStartPlayingButton();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to start exploring:",
        error
      );
    });
  });

  describe("when backlog item is already playing", () => {
    beforeEach(() => {
      // Arrange: Mock returns a CURRENTLY_EXPLORING item
      const playingItem = {
        ...mockLibraryItem,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      };
      mockUseMatchingBacklogItem.mockReturnValue(playingItem);
    });

    it("should not render the button", () => {
      // Act
      renderWithTestProviders(
        <StartPlayingActionButton
          game={mockGame}
          libraryItems={[mockLibraryItem]}
        />
      );

      // Assert
      expect(elements.queryStartPlayingButton()).not.toBeInTheDocument();
    });
  });

  describe("when no matching backlog item exists", () => {
    beforeEach(() => {
      // Arrange: Mock returns undefined (no matching item)
      mockUseMatchingBacklogItem.mockReturnValue(undefined);
    });

    it("should render button but clicking should not call action", async () => {
      // Act
      renderWithTestProviders(
        <StartPlayingActionButton game={mockGame} libraryItems={[]} />
      );

      // Assert - button should still render (component only hides for CURRENTLY_EXPLORING status)
      expect(elements.getStartPlayingButton()).toBeInTheDocument();

      // But clicking it should not call the action since no matching item
      await actions.clickStartPlayingButton();
      expect(mockUpdateBacklogItemAction).not.toHaveBeenCalled();
    });
  });

  describe("when libraryItems is undefined", () => {
    beforeEach(() => {
      // Arrange: Mock returns undefined for empty items
      mockUseMatchingBacklogItem.mockReturnValue(undefined);
    });

    it("should render button but clicking should not call action", async () => {
      // Act
      renderWithTestProviders(
        <StartPlayingActionButton game={mockGame} libraryItems={undefined} />
      );

      // Assert - button should still render
      expect(elements.getStartPlayingButton()).toBeInTheDocument();

      // But clicking it should not call the action
      await actions.clickStartPlayingButton();
      expect(mockUpdateBacklogItemAction).not.toHaveBeenCalled();
    });
  });
});
