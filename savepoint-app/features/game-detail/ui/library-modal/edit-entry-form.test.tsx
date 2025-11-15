import { LibraryItemStatus, type LibraryItem } from "@prisma/client";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { updateLibraryEntryAction } from "../../server-actions";
import { EditEntryForm } from "./edit-entry-form";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../server-actions", () => ({
  updateLibraryEntryAction: vi.fn(),
}));

vi.mock("@/shared/lib/date", () => ({
  formatRelativeDate: vi.fn(() => "2 days ago"),
}));

const mockUpdateLibraryEntryAction = vi.mocked(updateLibraryEntryAction);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const createMockLibraryItem = (
  overrides: Partial<LibraryItem> = {}
): LibraryItem => ({
  id: 1,
  userId: "user1",
  gameId: "game1",
  status: LibraryItemStatus.CURIOUS_ABOUT,
  platform: "PC",
  acquisitionType: "DIGITAL",
  createdAt: new Date("2025-01-25T12:00:00Z"),
  updatedAt: new Date("2025-01-27T12:00:00Z"),
  startedAt: null,
  completedAt: null,
  ...overrides,
});

const elements = {
  getStatusTrigger: () => screen.getByRole("combobox"),
  getCancelButton: () => screen.getByRole("button", { name: /cancel/i }),
  getSubmitButton: () => screen.getByRole("button", { name: /update entry/i }),
  getMetadataSection: () => screen.getByTestId("library-entry-metadata-card"),
  getCreatedDate: () => screen.getAllByText("2 days ago")[0],
  getPlatform: (platform: string) => screen.getByText(platform),
};

const actions = {
  selectStatus: async (statusLabel: string) => {
    await userEvent.click(elements.getStatusTrigger());
    await userEvent.click(screen.getByText(statusLabel));
  },

  clickCancel: async () => {
    await userEvent.click(elements.getCancelButton());
  },

  clickSubmit: async () => {
    await userEvent.click(elements.getSubmitButton());
  },

  selectStatusAndSubmit: async (statusLabel: string) => {
    await actions.selectStatus(statusLabel);
    await actions.clickSubmit();
  },
};

describe("EditEntryForm", () => {
  const defaultProps = {
    item: createMockLibraryItem(),
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateLibraryEntryAction.mockResolvedValue({
      success: true,
      data: createMockLibraryItem({ status: LibraryItemStatus.WISHLIST }),
    });
  });

  describe("given form just rendered", () => {
    it("should display LibraryEntryMetadata component", () => {
      render(<EditEntryForm {...defaultProps} />);

      expect(elements.getMetadataSection()).toBeInTheDocument();
      expect(screen.getByText("Created:")).toBeVisible();
    });

    it("should display created date from metadata", () => {
      render(<EditEntryForm {...defaultProps} />);

      expect(elements.getCreatedDate()).toBeInTheDocument();
    });

    it("should display platform from item", () => {
      render(<EditEntryForm {...defaultProps} />);

      expect(elements.getPlatform("PC")).toBeInTheDocument();
    });

    it("should display status selector with current status", () => {
      render(<EditEntryForm {...defaultProps} />);

      expect(elements.getStatusTrigger()).toBeInTheDocument();
    });

    it("should display cancel button", () => {
      render(<EditEntryForm {...defaultProps} />);

      expect(elements.getCancelButton()).toBeInTheDocument();
    });

    it("should display 'Update Entry' submit button", () => {
      render(<EditEntryForm {...defaultProps} />);

      expect(elements.getSubmitButton()).toHaveTextContent("Update Entry");
    });

    it("should display custom form description", () => {
      render(<EditEntryForm {...defaultProps} />);

      expect(
        screen.getByText("Update your journey status for this entry")
      ).toBeVisible();
    });
  });

  describe("given user cancels form", () => {
    it("should call onCancel callback", async () => {
      const onCancel = vi.fn();
      render(<EditEntryForm {...defaultProps} onCancel={onCancel} />);

      await actions.clickCancel();

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("given form is submitting", () => {
    it("should disable cancel button during submission", async () => {
      mockUpdateLibraryEntryAction.mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, data: createMockLibraryItem() };
      });

      render(<EditEntryForm {...defaultProps} />);

      await actions.selectStatusAndSubmit("Experienced");

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

      mockUpdateLibraryEntryAction.mockReturnValue(slowAction as any);

      render(<EditEntryForm {...defaultProps} />);

      // Select status and submit
      await userEvent.click(elements.getStatusTrigger());
      await userEvent.click(screen.getAllByText("Experienced")[0]);

      // Click submit but don't await - this starts the async action
      const submitPromise = userEvent.click(elements.getSubmitButton());

      // Check the loading state - query by type since text changes during loading
      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /updating/i });
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent("Updating...");
      });

      // Clean up: resolve the action and wait for submit to complete
      resolveAction!({ success: true, data: createMockLibraryItem() });
      await submitPromise;
    });
  });

  describe("given item with different platform", () => {
    it("should include platform in server action call", async () => {
      const item = createMockLibraryItem({ platform: "Nintendo Switch" });
      render(<EditEntryForm {...defaultProps} item={item} />);

      await actions.selectStatusAndSubmit("Experienced");

      await waitFor(() => {
        expect(mockUpdateLibraryEntryAction).toHaveBeenCalledWith({
          libraryItemId: 1,
          status: LibraryItemStatus.EXPERIENCED,
          platform: "Nintendo Switch",
        });
      });
    });

    it("should display Nintendo Switch in metadata", () => {
      const item = createMockLibraryItem({ platform: "Nintendo Switch" });
      render(<EditEntryForm {...defaultProps} item={item} />);

      expect(elements.getPlatform("Nintendo Switch")).toBeInTheDocument();
    });
  });
});
