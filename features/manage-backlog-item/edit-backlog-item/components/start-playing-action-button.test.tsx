import { renderWithTestProviders } from "@/test/utils/test-provider";
import { BacklogItemStatus } from "@prisma/client";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateBacklogItemAction } from "../hooks/update-backlog-action";
import { useMatchingBacklogItem } from "../hooks/use-matching-backlog-item";
import { StartPlayingActionButton } from "./start-playing-action-button";

// Mock the dependencies
vi.mock("../hooks/update-backlog-action", () => ({
  updateBacklogItemAction: vi.fn(),
}));

vi.mock("../hooks/use-matching-backlog-item", () => ({
  useMatchingBacklogItem: vi.fn(),
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}));

// Get the mocked functions
const mockUpdateBacklogItemAction = vi.mocked(updateBacklogItemAction);
const mockUseMatchingBacklogItem = vi.mocked(useMatchingBacklogItem);

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

  const mockBacklogItem = {
    id: 1,
    userId: "user-1",
    gameId: "game-1",
    platform: "PC",
    status: BacklogItemStatus.TO_PLAY,
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
      // Arrange: Mock returns a TO_PLAY item that can be started
      mockUseMatchingBacklogItem.mockReturnValue(mockBacklogItem);
    });

    it("should render the start playing button", () => {
      // Act
      renderWithTestProviders(
        <StartPlayingActionButton
          game={mockGame}
          backlogItems={[mockBacklogItem]}
        />
      );

      // Assert
      expect(elements.getStartPlayingButton()).toBeInTheDocument();
      expect(elements.getPlayIcon()).toBeInTheDocument();
    });

    it("should call updateBacklogItemAction when clicked", async () => {
      // Arrange
      mockUpdateBacklogItemAction.mockResolvedValue({ data: undefined });
      renderWithTestProviders(
        <StartPlayingActionButton
          game={mockGame}
          backlogItems={[mockBacklogItem]}
        />
      );

      // Act
      await actions.clickStartPlayingButton();

      // Assert
      expect(mockUpdateBacklogItemAction).toHaveBeenCalledWith({
        id: 1,
        status: "PLAYING",
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
          backlogItems={[mockBacklogItem]}
        />
      );

      // Act
      await actions.clickStartPlayingButton();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to start playing:",
        error
      );
    });
  });

  describe("when backlog item is already playing", () => {
    beforeEach(() => {
      // Arrange: Mock returns a PLAYING item
      const playingItem = {
        ...mockBacklogItem,
        status: BacklogItemStatus.PLAYING,
      };
      mockUseMatchingBacklogItem.mockReturnValue(playingItem);
    });

    it("should not render the button", () => {
      // Act
      renderWithTestProviders(
        <StartPlayingActionButton
          game={mockGame}
          backlogItems={[mockBacklogItem]}
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
        <StartPlayingActionButton game={mockGame} backlogItems={[]} />
      );

      // Assert - button should still render (component only hides for PLAYING status)
      expect(elements.getStartPlayingButton()).toBeInTheDocument();

      // But clicking it should not call the action since no matching item
      await actions.clickStartPlayingButton();
      expect(mockUpdateBacklogItemAction).not.toHaveBeenCalled();
    });
  });

  describe("when backlogItems is undefined", () => {
    beforeEach(() => {
      // Arrange: Mock returns undefined for empty items
      mockUseMatchingBacklogItem.mockReturnValue(undefined);
    });

    it("should render button but clicking should not call action", async () => {
      // Act
      renderWithTestProviders(
        <StartPlayingActionButton game={mockGame} backlogItems={undefined} />
      );

      // Assert - button should still render
      expect(elements.getStartPlayingButton()).toBeInTheDocument();

      // But clicking it should not call the action
      await actions.clickStartPlayingButton();
      expect(mockUpdateBacklogItemAction).not.toHaveBeenCalled();
    });
  });
});
