import { renderWithTestProviders } from "@/test/utils/test-provider";
import { BacklogItemStatus } from "@prisma/client";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateBacklogItemAction } from "../hooks/update-backlog-action";
import { useMatchingBacklogItem } from "../hooks/use-matching-backlog-item";
import { MoveToBacklogActionButton } from "./move-to-backlog-action-button";

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
  const mockBacklogItem = {
    id: 1,
    userId: "user-1",
    gameId: "game-1",
    platform: "PC",
    status: BacklogItemStatus.PLAYING,
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
      // Arrange: Mock returns a PLAYING item that can be moved to backlog
      mockUseMatchingBacklogItem.mockReturnValue(mockBacklogItem);
    });

    it("should render the move to backlog button", () => {
      // Act
      renderWithTestProviders(
        <MoveToBacklogActionButton backlogItems={[mockBacklogItem]} />
      );

      // Assert
      expect(elements.getMoveToBacklogButton()).toBeInTheDocument();
      expect(elements.getRotateIcon()).toBeInTheDocument();
    });

    it("should call updateBacklogItemAction when clicked", async () => {
      // Arrange
      mockUpdateBacklogItemAction.mockResolvedValue(undefined);
      renderWithTestProviders(
        <MoveToBacklogActionButton backlogItems={[mockBacklogItem]} />
      );

      // Act
      await actions.clickMoveToBacklogButton();

      // Assert
      expect(mockUpdateBacklogItemAction).toHaveBeenCalledWith({
        id: 1,
        status: "TO_PLAY",
      });
    });

    it("should handle server action errors gracefully", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error");
      const error = new Error("Network error");
      mockUpdateBacklogItemAction.mockRejectedValue(error);
      renderWithTestProviders(
        <MoveToBacklogActionButton backlogItems={[mockBacklogItem]} />
      );

      // Act
      await actions.clickMoveToBacklogButton();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to move to backlog:",
        error
      );
    });
  });

  describe("when backlog item is already in TO_PLAY status", () => {
    beforeEach(() => {
      // Arrange: Mock returns a TO_PLAY item
      const toPlayItem = {
        ...mockBacklogItem,
        status: BacklogItemStatus.TO_PLAY,
      };
      mockUseMatchingBacklogItem.mockReturnValue(toPlayItem);
    });

    it("should not render the button", () => {
      // Act
      renderWithTestProviders(
        <MoveToBacklogActionButton backlogItems={[mockBacklogItem]} />
      );

      // Assert
      expect(elements.queryMoveToBacklogButton()).not.toBeInTheDocument();
    });
  });

  describe("when backlog item is completed", () => {
    beforeEach(() => {
      // Arrange: Mock returns a COMPLETED item that can be moved to backlog
      const completedItem = {
        ...mockBacklogItem,
        status: BacklogItemStatus.COMPLETED,
      };
      mockUseMatchingBacklogItem.mockReturnValue(completedItem);
    });

    it("should render the button and allow moving to backlog", async () => {
      // Arrange
      mockUpdateBacklogItemAction.mockResolvedValue(undefined);
      renderWithTestProviders(
        <MoveToBacklogActionButton backlogItems={[mockBacklogItem]} />
      );

      // Act
      await actions.clickMoveToBacklogButton();

      // Assert
      expect(mockUpdateBacklogItemAction).toHaveBeenCalledWith({
        id: 1,
        status: "TO_PLAY",
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
      renderWithTestProviders(<MoveToBacklogActionButton backlogItems={[]} />);

      // Assert - button should still render (component only hides for TO_PLAY status)
      expect(elements.getMoveToBacklogButton()).toBeInTheDocument();

      // But clicking it should not call the action since no matching item
      await actions.clickMoveToBacklogButton();
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
        <MoveToBacklogActionButton backlogItems={undefined} />
      );

      // Assert - button should still render
      expect(elements.getMoveToBacklogButton()).toBeInTheDocument();

      // But clicking it should not call the action
      await actions.clickMoveToBacklogButton();
      expect(mockUpdateBacklogItemAction).not.toHaveBeenCalled();
    });
  });
});
