import { renderWithTestProviders } from "@/test/utils/test-provider";
import { LibraryItemStatus } from "@prisma/client";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateLibraryItemAction } from "../hooks/update-library-action";
import { useMatchingLibraryItem } from "../hooks/use-matching-library-item";
import { MoveToBacklogActionButton } from "./move-to-backlog-action-button";

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
  getMoveToBacklogButton: () => screen.getByRole("button"),
  queryMoveToBacklogButton: () => screen.queryByRole("button"),
  getRotateIcon: () => screen.getByRole("button").querySelector("svg"),
};

const actions = {
  clickMoveToBacklogButton: async () => {
    const user = userEvent.setup();
    const button = elements.getMoveToBacklogButton();
    await user.click(button);
  },
};

describe("MoveToBacklogActionButton", () => {
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
    status: LibraryItemStatus.CURRENTLY_EXPLORING,
    acquisitionType: "DIGITAL" as const,
    startedAt: new Date("2024-01-01"),
    completedAt: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("when backlog item can be moved to backlog", () => {
    beforeEach(() => {
      // Arrange: Mock returns a CURRENTLY_EXPLORING item that can be moved to backlog
      mockUseMatchingBacklogItem.mockReturnValue(mockLibraryItem);
    });

    it("should render the move to backlog button", () => {
      // Act
      renderWithTestProviders(
        <MoveToBacklogActionButton
          game={mockGame}
          libraryItems={[mockLibraryItem]}
        />
      );

      // Assert
      expect(elements.getMoveToBacklogButton()).toBeInTheDocument();
      expect(elements.getRotateIcon()).toBeInTheDocument();
    });

    it("should call updateLibraryItemAction when clicked", async () => {
      // Arrange
      mockUpdateBacklogItemAction.mockResolvedValue({ data: undefined });
      renderWithTestProviders(
        <MoveToBacklogActionButton
          game={mockGame}
          libraryItems={[mockLibraryItem]}
        />
      );

      // Act
      await actions.clickMoveToBacklogButton();

      // Assert
      expect(mockUpdateBacklogItemAction).toHaveBeenCalledWith({
        id: 1,
        status: "CURIOUS_ABOUT",
      });
    });

    it("should handle server action errors gracefully", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error");
      const error = new Error("Network error");
      mockUpdateBacklogItemAction.mockRejectedValue(error);
      renderWithTestProviders(
        <MoveToBacklogActionButton
          game={mockGame}
          libraryItems={[mockLibraryItem]}
        />
      );

      // Act
      await actions.clickMoveToBacklogButton();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to mark as curious about:",
        error
      );
    });
  });

  describe("when backlog item is already in CURIOUS_ABOUT status", () => {
    beforeEach(() => {
      // Arrange: Mock returns a CURIOUS_ABOUT item
      const toPlayItem = {
        ...mockLibraryItem,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      };
      mockUseMatchingBacklogItem.mockReturnValue(toPlayItem);
    });

    it("should not render the button", () => {
      // Act
      renderWithTestProviders(
        <MoveToBacklogActionButton
          game={mockGame}
          libraryItems={[mockLibraryItem]}
        />
      );

      // Assert
      expect(elements.queryMoveToBacklogButton()).not.toBeInTheDocument();
    });
  });

  describe("when backlog item is completed", () => {
    beforeEach(() => {
      // Arrange: Mock returns a EXPERIENCED item that can be moved to backlog
      const completedItem = {
        ...mockLibraryItem,
        status: LibraryItemStatus.EXPERIENCED,
      };
      mockUseMatchingBacklogItem.mockReturnValue(completedItem);
    });

    it("should render the button and allow moving to backlog", async () => {
      // Arrange
      mockUpdateBacklogItemAction.mockResolvedValue({ data: undefined });
      renderWithTestProviders(
        <MoveToBacklogActionButton
          game={mockGame}
          libraryItems={[mockLibraryItem]}
        />
      );

      // Act
      await actions.clickMoveToBacklogButton();

      // Assert
      expect(mockUpdateBacklogItemAction).toHaveBeenCalledWith({
        id: 1,
        status: "CURIOUS_ABOUT",
      });
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
        <MoveToBacklogActionButton game={mockGame} libraryItems={[]} />
      );

      // Assert - button should still render (component only hides for CURIOUS_ABOUT status)
      expect(elements.getMoveToBacklogButton()).toBeInTheDocument();

      // But clicking it should not call the action since no matching item
      await actions.clickMoveToBacklogButton();
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
        <MoveToBacklogActionButton game={mockGame} libraryItems={undefined} />
      );

      // Assert - button should still render
      expect(elements.getMoveToBacklogButton()).toBeInTheDocument();

      // But clicking it should not call the action
      await actions.clickMoveToBacklogButton();
      expect(mockUpdateBacklogItemAction).not.toHaveBeenCalled();
    });
  });
});
