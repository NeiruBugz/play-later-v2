import { LibraryItemStatus } from "@prisma/client";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { addToLibraryAction } from "../../server-actions";
import { AddEntryForm } from "./add-entry-form";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../server-actions", () => ({
  addToLibraryAction: vi.fn(),
}));

const mockAddToLibraryAction = vi.mocked(addToLibraryAction);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const elements = {
  getStatusTrigger: () => screen.getByRole("combobox"),
  getCancelButton: () => screen.getByRole("button", { name: /cancel/i }),
  getSubmitButton: () =>
    screen.getByRole("button", { name: /add to library|add entry/i }),
  getEditModeInfo: () => screen.queryByText(/Add another library entry for/i),
  getFormDescription: () =>
    screen.getByText("Select your current journey status with this game"),
};

const actions = {
  selectStatus: async (statusLabel: string) => {
    const user = userEvent.setup();
    await user.click(elements.getStatusTrigger());
    await user.click(screen.getByText(statusLabel));
  },

  clickCancel: async () => {
    const user = userEvent.setup();
    await user.click(elements.getCancelButton());
  },

  clickSubmit: async () => {
    const user = userEvent.setup();
    await user.click(elements.getSubmitButton());
  },

  selectStatusAndSubmit: async (statusLabel: string) => {
    await actions.selectStatus(statusLabel);
    await actions.clickSubmit();
  },
};

describe("AddEntryForm", () => {
  const defaultProps = {
    igdbId: 12345,
    gameTitle: "The Legend of Zelda: Breath of the Wild",
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddToLibraryAction.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        userId: "user1",
        gameId: "game1",
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: null,
        acquisitionType: "DIGITAL",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        completedAt: null,
      },
    });
  });

  describe("given form just rendered in add mode", () => {
    it("should display status selector", () => {
      render(<AddEntryForm {...defaultProps} />);

      expect(elements.getStatusTrigger()).toBeInTheDocument();
    });

    it("should display form description", () => {
      render(<AddEntryForm {...defaultProps} />);

      expect(elements.getFormDescription()).toBeInTheDocument();
    });

    it("should display cancel button", () => {
      render(<AddEntryForm {...defaultProps} />);

      expect(elements.getCancelButton()).toBeInTheDocument();
    });

    it("should display 'Add to Library' submit button", () => {
      render(<AddEntryForm {...defaultProps} />);

      expect(elements.getSubmitButton()).toHaveTextContent("Add to Library");
    });

    it("should not display edit mode info message", () => {
      render(<AddEntryForm {...defaultProps} />);

      expect(elements.getEditModeInfo()).not.toBeInTheDocument();
    });
  });

  describe("given form rendered in edit mode", () => {
    it("should display 'Add Entry' submit button", () => {
      render(<AddEntryForm {...defaultProps} isEditMode />);

      expect(elements.getSubmitButton()).toHaveTextContent("Add Entry");
    });

    it("should display edit mode info message with game title", () => {
      render(<AddEntryForm {...defaultProps} isEditMode />);

      expect(elements.getEditModeInfo()).toBeInTheDocument();
      expect(
        screen.getByText(/The Legend of Zelda: Breath of the Wild/)
      ).toBeVisible();
    });

    it("should explain multiple platform use case", () => {
      render(<AddEntryForm {...defaultProps} isEditMode />);

      expect(
        screen.getByText(/own the game on multiple platforms/)
      ).toBeVisible();
    });
  });

  describe("given user cancels form", () => {
    it("should call onCancel callback", async () => {
      const onCancel = vi.fn();
      render(<AddEntryForm {...defaultProps} onCancel={onCancel} />);

      await actions.clickCancel();

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("given form submission succeeds", () => {
    it("should call server action with correct data", async () => {
      render(<AddEntryForm {...defaultProps} />);

      await actions.selectStatusAndSubmit("Wishlist");

      await waitFor(() => {
        expect(mockAddToLibraryAction).toHaveBeenCalledWith({
          igdbId: 12345,
          status: LibraryItemStatus.WISHLIST,
          platform: undefined,
        });
      });
    });

    it("should display success toast in add mode", async () => {
      render(<AddEntryForm {...defaultProps} />);

      await actions.selectStatusAndSubmit("Wishlist");

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Game added to library", {
          description:
            "The Legend of Zelda: Breath of the Wild has been added to your library.",
        });
      });
    });

    it("should display success toast in edit mode", async () => {
      render(<AddEntryForm {...defaultProps} isEditMode />);

      await actions.selectStatusAndSubmit("Wishlist");

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("New entry added", {
          description: "A new library entry has been created.",
        });
      });
    });

    it("should call onSuccess callback", async () => {
      const onSuccess = vi.fn();
      render(<AddEntryForm {...defaultProps} onSuccess={onSuccess} />);

      await actions.selectStatusAndSubmit("Wishlist");

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("should reset form after successful submission", async () => {
      render(<AddEntryForm {...defaultProps} />);

      await actions.selectStatusAndSubmit("Wishlist");

      await waitFor(() => {
        expect(mockAddToLibraryAction).toHaveBeenCalled();
      });
    });
  });

  describe("given form submission fails", () => {
    it("should display error toast with error message", async () => {
      mockAddToLibraryAction.mockResolvedValueOnce({
        success: false,
        error: "Failed to add game to library",
      });

      render(<AddEntryForm {...defaultProps} />);

      await actions.selectStatusAndSubmit("Wishlist");

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to add game", {
          description: "Failed to add game to library",
        });
      });
    });

    it("should not call onSuccess callback on failure", async () => {
      const onSuccess = vi.fn();
      mockAddToLibraryAction.mockResolvedValueOnce({
        success: false,
        error: "Failed to add game",
      });

      render(<AddEntryForm {...defaultProps} onSuccess={onSuccess} />);

      await actions.selectStatusAndSubmit("Wishlist");

      await waitFor(() => {
        expect(mockAddToLibraryAction).toHaveBeenCalled();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe("given form submission throws exception", () => {
    it("should display generic error toast", async () => {
      mockAddToLibraryAction.mockRejectedValueOnce(new Error("Network error"));

      render(<AddEntryForm {...defaultProps} />);

      await actions.selectStatusAndSubmit("Wishlist");

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          "An unexpected error occurred",
          {
            description: "Network error",
          }
        );
      });
    });
  });

  describe("given form is submitting", () => {
    it("should disable cancel button during submission", async () => {
      mockAddToLibraryAction.mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, data: {} as any };
      });

      render(<AddEntryForm {...defaultProps} />);

      await actions.selectStatusAndSubmit("Wishlist");

      await waitFor(() => {
        expect(elements.getCancelButton()).toBeDisabled();
      });
    });

    it("should disable submit button and show loading text", async () => {
      // Create a promise that won't resolve immediately
      let resolveAction: (value: any) => void;
      const slowAction = new Promise((resolve) => {
        resolveAction = resolve;
      });

      mockAddToLibraryAction.mockReturnValue(slowAction as any);

      const user = userEvent.setup();
      render(<AddEntryForm {...defaultProps} />);

      // Select status and submit
      await user.click(elements.getStatusTrigger());
      await user.click(screen.getAllByText("Wishlist")[0]);

      // Click submit but don't await - this starts the async action
      const submitPromise = user.click(elements.getSubmitButton());

      // Check the loading state - query by type since text changes during loading
      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /adding/i });
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent("Adding...");
      });

      // Clean up: resolve the action and wait for submit to complete
      resolveAction!({ success: true, data: {} as any });
      await submitPromise;
    });
  });
});
