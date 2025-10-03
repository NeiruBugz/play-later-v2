import { renderWithTestProviders } from "@/test/utils/test-provider";
import { LibraryItemStatus } from "@prisma/client";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateLibraryItemAction } from "../hooks/update-library-action";
import { useMatchingLibraryItem } from "../hooks/use-matching-library-item";
import { CompleteActionButton } from "./complete-action-button";

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
const mockUpdateLibraryItemAction = vi.mocked(updateLibraryItemAction);
const mockUseMatchingLibraryItem = vi.mocked(useMatchingLibraryItem);

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

  describe("when matching backlog item can be completed", () => {
    beforeEach(() => {
      // Arrange: Mock returns a CURRENTLY_EXPLORING item that can be completed
      mockUseMatchingLibraryItem.mockReturnValue(mockLibraryItem);
    });

    it("should render the complete button", () => {
      // Act
      renderWithTestProviders(
        <CompleteActionButton libraryItems={[mockLibraryItem]} />
      );

      // Assert
      expect(elements.getCompleteButton()).toBeInTheDocument();
      expect(elements.getCheckIcon()).toBeInTheDocument();
    });

    it("should call updateLibraryItemAction when clicked", async () => {
      // Arrange
      mockUpdateLibraryItemAction.mockResolvedValue({ data: undefined });
      renderWithTestProviders(
        <CompleteActionButton libraryItems={[mockLibraryItem]} />
      );

      // Act
      await actions.clickCompleteButton();

      // Assert
      expect(mockUpdateLibraryItemAction).toHaveBeenCalledWith({
        id: 1,
        status: "EXPERIENCED",
      });
    });

    it("should handle server action errors gracefully", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error");
      const error = new Error("Network error");
      mockUpdateLibraryItemAction.mockRejectedValue(error);
      renderWithTestProviders(
        <CompleteActionButton libraryItems={[mockLibraryItem]} />
      );

      // Act
      await actions.clickCompleteButton();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(error);
    });
  });

  describe("when matching backlog item is already completed", () => {
    beforeEach(() => {
      // Arrange: Mock returns a EXPERIENCED item
      const completedItem = {
        ...mockLibraryItem,
        status: LibraryItemStatus.EXPERIENCED,
      };
      mockUseMatchingLibraryItem.mockReturnValue(completedItem);
    });

    it("should not render the button", () => {
      // Act
      renderWithTestProviders(
        <CompleteActionButton libraryItems={[mockLibraryItem]} />
      );

      // Assert
      expect(elements.queryCompleteButton()).not.toBeInTheDocument();
    });
  });

  describe("when no matching backlog item exists", () => {
    beforeEach(() => {
      // Arrange: Mock returns undefined (no matching item)
      mockUseMatchingLibraryItem.mockReturnValue(undefined);
    });

    it("should render the button but clicking should not call action", async () => {
      // Act
      renderWithTestProviders(<CompleteActionButton libraryItems={[]} />);

      // Assert - button should still render since component only hides for EXPERIENCED status
      expect(elements.getCompleteButton()).toBeInTheDocument();

      // But clicking it should not call the action since no matching item
      await actions.clickCompleteButton();
      expect(mockUpdateLibraryItemAction).not.toHaveBeenCalled();
    });
  });

  describe("when libraryItems is undefined", () => {
    beforeEach(() => {
      // Arrange: Mock returns undefined for empty items
      mockUseMatchingLibraryItem.mockReturnValue(undefined);
    });

    it("should render the button but clicking should not call action", async () => {
      // Act
      renderWithTestProviders(
        <CompleteActionButton libraryItems={undefined} />
      );

      // Assert - button should still render
      expect(elements.getCompleteButton()).toBeInTheDocument();

      // But clicking it should not call the action
      await actions.clickCompleteButton();
      expect(mockUpdateLibraryItemAction).not.toHaveBeenCalled();
    });
  });
});
