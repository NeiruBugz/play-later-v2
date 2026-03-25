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
  acquisitionType: "DIGITAL" as const,
  startedAt: null,
  completedAt: null,
  hasBeenPlayed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const elements = {
  getWishlistedButton: () => screen.getByLabelText("Wishlisted"),
  getOnShelfButton: () => screen.getByLabelText("On Shelf"),
  getUpNextButton: () => screen.getByLabelText("Up Next"),
  getPlayingButton: () => screen.getByLabelText("Playing"),
  getPlayedButton: () => screen.getByLabelText("Played"),
  getAllStatusButtons: () => screen.getAllByRole("button"),
  getQuickActionsGroup: () =>
    screen.getByRole("group", { name: /journey status quick actions/i }),
  getAnnouncementRegion: () => screen.getByRole("status"),
};

const actions = {
  clickWishlistedButton: async () => {
    await userEvent.click(elements.getWishlistedButton());
  },
  clickOnShelfButton: async () => {
    await userEvent.click(elements.getOnShelfButton());
  },
  clickUpNextButton: async () => {
    await userEvent.click(elements.getUpNextButton());
  },
  clickPlayingButton: async () => {
    await userEvent.click(elements.getPlayingButton());
  },
  clickPlayedButton: async () => {
    await userEvent.click(elements.getPlayedButton());
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
      data: createMockLibraryItem(LibraryItemStatus.WISHLIST),
    });
  });

  describe("given component just rendered", () => {
    it("should render all 5 status buttons", () => {
      render(<QuickActionButtons {...defaultProps} />);

      expect(elements.getWishlistedButton()).toBeVisible();
      expect(elements.getOnShelfButton()).toBeVisible();
      expect(elements.getUpNextButton()).toBeVisible();
      expect(elements.getPlayingButton()).toBeVisible();
      expect(elements.getPlayedButton()).toBeVisible();

      const allButtons = elements.getAllStatusButtons();
      expect(allButtons).toHaveLength(5);
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
    it("should mark the Wishlisted button as pressed when status is WISHLIST", () => {
      render(
        <QuickActionButtons
          {...defaultProps}
          currentStatus={LibraryItemStatus.WISHLIST}
        />
      );

      expect(elements.getWishlistedButton()).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(elements.getOnShelfButton()).toHaveAttribute(
        "aria-pressed",
        "false"
      );
      expect(elements.getPlayingButton()).toHaveAttribute(
        "aria-pressed",
        "false"
      );
      expect(elements.getPlayedButton()).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    it("should mark the On Shelf button as pressed when status is SHELF", () => {
      render(
        <QuickActionButtons
          {...defaultProps}
          currentStatus={LibraryItemStatus.SHELF}
        />
      );

      expect(elements.getOnShelfButton()).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(elements.getWishlistedButton()).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    it("should mark the Playing button as pressed when status is PLAYING", () => {
      render(
        <QuickActionButtons
          {...defaultProps}
          currentStatus={LibraryItemStatus.PLAYING}
        />
      );

      expect(elements.getPlayingButton()).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(elements.getWishlistedButton()).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    it("should mark the Played button as pressed when status is PLAYED", () => {
      render(
        <QuickActionButtons
          {...defaultProps}
          currentStatus={LibraryItemStatus.PLAYED}
        />
      );

      expect(elements.getPlayedButton()).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(elements.getWishlistedButton()).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });
  });

  describe("given user clicks a status button", () => {
    it("should call updateLibraryStatusAction with correct parameters for Wishlist", async () => {
      render(<QuickActionButtons {...defaultProps} />);

      await actions.clickWishlistedButton();

      await waitFor(() => {
        expect(mockUpdateLibraryStatusAction).toHaveBeenCalledWith({
          igdbId: 12345,
          status: LibraryItemStatus.WISHLIST,
        });
      });
    });

    it("should call updateLibraryStatusAction with correct parameters for On Shelf", async () => {
      render(<QuickActionButtons {...defaultProps} />);

      await actions.clickOnShelfButton();

      await waitFor(() => {
        expect(mockUpdateLibraryStatusAction).toHaveBeenCalledWith({
          igdbId: 12345,
          status: LibraryItemStatus.SHELF,
        });
      });
    });

    it("should display success toast with correct message for Playing", async () => {
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

    it("should update announcement region for screen readers when marking as Played", async () => {
      render(<QuickActionButtons {...defaultProps} />);

      await actions.clickPlayedButton();

      await waitFor(() => {
        expect(elements.getAnnouncementRegion()).toHaveTextContent(
          "Status updated to Played"
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

      await actions.clickOnShelfButton();

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to update status", {
          description: "Network error",
        });
      });
    });

    it("should update announcement region with error message", async () => {
      render(<QuickActionButtons {...defaultProps} />);

      await actions.clickPlayedButton();

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
          currentStatus={LibraryItemStatus.WISHLIST}
        />
      );

      await actions.clickPlayingButton();

      // After error, should revert to original status
      await waitFor(() => {
        expect(elements.getWishlistedButton()).toHaveAttribute(
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

      await actions.clickWishlistedButton();

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
                  data: createMockLibraryItem(LibraryItemStatus.WISHLIST),
                }),
              100
            );
          })
      );
    });

    it("should disable all 5 buttons during transition", async () => {
      render(<QuickActionButtons {...defaultProps} />);

      await actions.clickWishlistedButton();

      expect(elements.getWishlistedButton()).toBeDisabled();
      expect(elements.getOnShelfButton()).toBeDisabled();
      expect(elements.getUpNextButton()).toBeDisabled();
      expect(elements.getPlayingButton()).toBeDisabled();
      expect(elements.getPlayedButton()).toBeDisabled();
    });

    it("should show optimistic update immediately before server responds", async () => {
      render(
        <QuickActionButtons
          {...defaultProps}
          currentStatus={LibraryItemStatus.SHELF}
        />
      );

      // Verify initial state
      expect(elements.getOnShelfButton()).toHaveAttribute(
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
      // - On Shelf button should no longer be pressed
      expect(elements.getPlayingButton()).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(elements.getOnShelfButton()).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });
  });
});
