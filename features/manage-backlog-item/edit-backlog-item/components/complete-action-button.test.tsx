import { renderWithTestProviders } from "@/test/utils/test-provider";
import { BacklogItemStatus } from "@prisma/client";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateBacklogItemAction } from "../hooks/update-backlog-action";
import { useMatchingBacklogItem } from "../hooks/use-matching-backlog-item";
import { CompleteActionButton } from "./complete-action-button";

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
  getCompleteButton: () => screen.getByRole("button"),
  queryCompleteButton: () => screen.queryByRole("button"),
  getCheckIcon: () => screen.getByRole("button").querySelector("svg"),
};

const actions = {
  clickCompleteButton: async () => {
    const user = userEvent.setup();
    const button = elements.getCompleteButton();
    await user.click(button);
  },
};

describe("CompleteActionButton", () => {
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

  describe("when matching backlog item can be completed", () => {
    beforeEach(() => {
      // Arrange: Mock returns a PLAYING item that can be completed
      mockUseMatchingBacklogItem.mockReturnValue(mockBacklogItem);
    });

    it("should render the complete button", () => {
      // Act
      renderWithTestProviders(
        <CompleteActionButton backlogItems={[mockBacklogItem]} />
      );

      // Assert
      expect(elements.getCompleteButton()).toBeInTheDocument();
      expect(elements.getCheckIcon()).toBeInTheDocument();
    });

    it("should call updateBacklogItemAction when clicked", async () => {
      // Arrange
      mockUpdateBacklogItemAction.mockResolvedValue({ data: undefined });
      renderWithTestProviders(
        <CompleteActionButton backlogItems={[mockBacklogItem]} />
      );

      // Act
      await actions.clickCompleteButton();

      // Assert
      expect(mockUpdateBacklogItemAction).toHaveBeenCalledWith({
        id: 1,
        status: "COMPLETED",
      });
    });

    it("should handle server action errors gracefully", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error");
      const error = new Error("Network error");
      mockUpdateBacklogItemAction.mockRejectedValue(error);
      renderWithTestProviders(
        <CompleteActionButton backlogItems={[mockBacklogItem]} />
      );

      // Act
      await actions.clickCompleteButton();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(error);
    });
  });

  describe("when matching backlog item is already completed", () => {
    beforeEach(() => {
      // Arrange: Mock returns a COMPLETED item
      const completedItem = {
        ...mockBacklogItem,
        status: BacklogItemStatus.COMPLETED,
      };
      mockUseMatchingBacklogItem.mockReturnValue(completedItem);
    });

    it("should not render the button", () => {
      // Act
      renderWithTestProviders(
        <CompleteActionButton backlogItems={[mockBacklogItem]} />
      );

      // Assert
      expect(elements.queryCompleteButton()).not.toBeInTheDocument();
    });
  });

  describe("when no matching backlog item exists", () => {
    beforeEach(() => {
      // Arrange: Mock returns undefined (no matching item)
      mockUseMatchingBacklogItem.mockReturnValue(undefined);
    });

    it("should render the button but clicking should not call action", async () => {
      // Act
      renderWithTestProviders(<CompleteActionButton backlogItems={[]} />);

      // Assert - button should still render since component only hides for COMPLETED status
      expect(elements.getCompleteButton()).toBeInTheDocument();

      // But clicking it should not call the action since no matching item
      await actions.clickCompleteButton();
      expect(mockUpdateBacklogItemAction).not.toHaveBeenCalled();
    });
  });

  describe("when backlogItems is undefined", () => {
    beforeEach(() => {
      // Arrange: Mock returns undefined for empty items
      mockUseMatchingBacklogItem.mockReturnValue(undefined);
    });

    it("should render the button but clicking should not call action", async () => {
      // Act
      renderWithTestProviders(
        <CompleteActionButton backlogItems={undefined} />
      );

      // Assert - button should still render
      expect(elements.getCompleteButton()).toBeInTheDocument();

      // But clicking it should not call the action
      await actions.clickCompleteButton();
      expect(mockUpdateBacklogItemAction).not.toHaveBeenCalled();
    });
  });
});
