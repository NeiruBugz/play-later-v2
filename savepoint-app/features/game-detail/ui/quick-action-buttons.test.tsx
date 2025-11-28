import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { updateLibraryStatusAction } from "@/features/manage-library-entry/server-actions";
import { LibraryItemStatus, type LibraryItemDomain } from "@/shared/types";

import { QuickActionButtons } from "./quick-action-buttons";

// Mock server action
vi.mock("@/features/manage-library-entry/server-actions", () => ({
  updateLibraryStatusAction: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUpdateLibraryStatusAction = vi.mocked(updateLibraryStatusAction);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

// Helper to create mock library item
const createMockLibraryItem = (
  status: LibraryItemStatus
): LibraryItemDomain => ({
  id: 1,
  userId: "user-123",
  gameId: "game-123",
  status,
  platform: "PC",
  acquisitionType: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const elements = {
  getCuriousButton: () => screen.getByLabelText("Mark as Curious About"),
  getPlayingButton: () => screen.getByLabelText("Mark as Currently Exploring"),
  getBreakButton: () => screen.getByLabelText("Mark as Taking a Break"),
  getExperiencedButton: () => screen.getByLabelText("Mark as Experienced"),
  getWishlistButton: () => screen.getByLabelText("Add to Wishlist"),
  getRevisitingButton: () => screen.getByLabelText("Mark as Revisiting"),
  getQuickActionsGroup: () =>
    screen.getByRole("group", { name: /journey status quick actions/i }),
  getAnnouncementRegion: () => screen.getByRole("status"),
};

const actions = {
  clickCuriousButton: async () => {
    await userEvent.click(elements.getCuriousButton());
  },
  clickPlayingButton: async () => {
    await userEvent.click(elements.getPlayingButton());
  },
  clickBreakButton: async () => {
    await userEvent.click(elements.getBreakButton());
  },
  clickExperiencedButton: async () => {
    await userEvent.click(elements.getExperiencedButton());
  },
  clickWishlistButton: async () => {
    await userEvent.click(elements.getWishlistButton());
  },
  clickRevisitingButton: async () => {
    await userEvent.click(elements.getRevisitingButton());
  },
};

describe("QuickActionButtons", () => {
  const defaultProps = {
    igdbId: 12345,
    gameTitle: "Test Game",
    currentStatus: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: action succeeds
    mockUpdateLibraryStatusAction.mockResolvedValue({
      success: true,
      data: createMockLibraryItem(LibraryItemStatus.CURIOUS_ABOUT),
    });
  });

  describe("given component just rendered", () => {
    it("should render all status buttons", () => {
      render(<QuickActionButtons {...defaultProps} />);

      expect(elements.getCuriousButton()).toBeVisible();
      expect(elements.getPlayingButton()).toBeVisible();
      expect(elements.getBreakButton()).toBeVisible();
      expect(elements.getExperiencedButton()).toBeVisible();
      expect(elements.getWishlistButton()).toBeVisible();
      expect(elements.getRevisitingButton()).toBeVisible();
    });

    it("should render buttons within a labeled group", () => {
      render(<QuickActionButtons {...defaultProps} />);

      expect(elements.getQuickActionsGroup()).toBeVisible();
    });

    it("should have accessible announcement region for status updates", () => {
      render(<QuickActionButtons {...defaultProps} />);

      const announcement = elements.getAnnouncementRegion();
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveAttribute("aria-live", "polite");
      expect(announcement).toHaveAttribute("aria-atomic", "true");
    });
  });

  describe("given current status is set", () => {
    it("should mark the Curious button as pressed when status is CURIOUS_ABOUT", () => {
      render(
        <QuickActionButtons
          {...defaultProps}
          currentStatus={LibraryItemStatus.CURIOUS_ABOUT}
        />
      );

      expect(elements.getCuriousButton()).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(elements.getPlayingButton()).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    it("should mark the Playing button as pressed when status is CURRENTLY_EXPLORING", () => {
      render(
        <QuickActionButtons
          {...defaultProps}
          currentStatus={LibraryItemStatus.CURRENTLY_EXPLORING}
        />
      );

      expect(elements.getPlayingButton()).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(elements.getCuriousButton()).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    it("should mark the Experienced button as pressed when status is EXPERIENCED", () => {
      render(
        <QuickActionButtons
          {...defaultProps}
          currentStatus={LibraryItemStatus.EXPERIENCED}
        />
      );

      expect(elements.getExperiencedButton()).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });
  });

  describe("given user clicks a status button", () => {
    it("should call updateLibraryStatusAction with correct parameters", async () => {
      render(<QuickActionButtons {...defaultProps} />);

      await actions.clickCuriousButton();

      await waitFor(() => {
        expect(mockUpdateLibraryStatusAction).toHaveBeenCalledWith({
          igdbId: 12345,
          status: LibraryItemStatus.CURIOUS_ABOUT,
        });
      });
    });

    it("should display success toast with correct message", async () => {
      render(<QuickActionButtons {...defaultProps} />);

      await actions.clickPlayingButton();

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(
          "Status updated to Playing",
          {
            description: "Test Game",
          }
        );
      });
    });

    it("should update announcement region for screen readers", async () => {
      render(<QuickActionButtons {...defaultProps} />);

      await actions.clickExperiencedButton();

      await waitFor(() => {
        expect(elements.getAnnouncementRegion()).toHaveTextContent(
          "Status updated to Finished"
        );
      });
    });
  });

  describe("given status update fails", () => {
    beforeEach(() => {
      mockUpdateLibraryStatusAction.mockResolvedValue({
        success: false,
        error: "Network error",
      });
    });

    it("should display error toast with server error message", async () => {
      render(<QuickActionButtons {...defaultProps} />);

      await actions.clickWishlistButton();

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to update status", {
          description: "Network error",
        });
      });
    });

    it("should update announcement region with error message", async () => {
      render(<QuickActionButtons {...defaultProps} />);

      await actions.clickRevisitingButton();

      await waitFor(() => {
        expect(elements.getAnnouncementRegion()).toHaveTextContent(
          "Failed to update status"
        );
      });
    });

    it("should revert optimistic update on error", async () => {
      render(
        <QuickActionButtons
          {...defaultProps}
          currentStatus={LibraryItemStatus.CURIOUS_ABOUT}
        />
      );

      await actions.clickPlayingButton();

      // After error, should revert to original status
      await waitFor(() => {
        expect(elements.getCuriousButton()).toHaveAttribute(
          "aria-pressed",
          "true"
        );
        expect(elements.getPlayingButton()).toHaveAttribute(
          "aria-pressed",
          "false"
        );
      });
    });
  });

  describe("given status update with undefined error message", () => {
    beforeEach(() => {
      mockUpdateLibraryStatusAction.mockResolvedValue({
        success: false,
        error: "",
      });
    });

    it("should display generic error description", async () => {
      render(<QuickActionButtons {...defaultProps} />);

      await actions.clickCuriousButton();

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to update status", {
          description: "Please try again",
        });
      });
    });
  });

  describe("given pending state", () => {
    beforeEach(() => {
      mockUpdateLibraryStatusAction.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: createMockLibraryItem(LibraryItemStatus.CURIOUS_ABOUT),
                }),
              100
            );
          })
      );
    });

    it("should disable all buttons during transition", async () => {
      render(<QuickActionButtons {...defaultProps} />);

      await actions.clickCuriousButton();

      expect(elements.getCuriousButton()).toBeDisabled();
      expect(elements.getPlayingButton()).toBeDisabled();
      expect(elements.getBreakButton()).toBeDisabled();
      expect(elements.getExperiencedButton()).toBeDisabled();
      expect(elements.getWishlistButton()).toBeDisabled();
      expect(elements.getRevisitingButton()).toBeDisabled();
    });

    it("should show optimistic update immediately before server responds", async () => {
      render(
        <QuickActionButtons
          {...defaultProps}
          currentStatus={LibraryItemStatus.WISHLIST}
        />
      );

      // Verify initial state
      expect(elements.getWishlistButton()).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(elements.getPlayingButton()).toHaveAttribute(
        "aria-pressed",
        "false"
      );

      // Click Playing button - should show as pressed immediately (optimistic)
      await actions.clickPlayingButton();

      // Immediately after click, before server responds (100ms delay):
      // - Playing button should be pressed (optimistic state)
      // - Wishlist button should no longer be pressed
      expect(elements.getPlayingButton()).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(elements.getWishlistButton()).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });
  });
});
