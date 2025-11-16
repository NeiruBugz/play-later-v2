import { LibraryItemStatus, type LibraryItem } from "@prisma/client";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
  getPlatformField: () => screen.getByLabelText(/^Platform$/i),
  getPlatformMessage: () =>
    screen.getByText(
      /Platform cannot be changed\. Create a new entry for a different platform\./i
    ),
  getStartedAtField: () => screen.getByLabelText(/Started At/i),
  getCompletedAtField: () => screen.getByLabelText(/Completed At/i),
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

  selectDate: async (field: HTMLElement, date: string) => {
    await userEvent.clear(field);
    await userEvent.type(field, date);
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

    it("should display platform from item in metadata", () => {
      render(<EditEntryForm {...defaultProps} />);

      const metadataSection = elements.getMetadataSection();
      expect(within(metadataSection).getByText("PC")).toBeInTheDocument();
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

  describe("Platform Field Restrictions", () => {
    it("should disable platform field in edit mode", () => {
      render(<EditEntryForm {...defaultProps} />);

      const platformField = elements.getPlatformField();
      expect(platformField).toBeDisabled();
      expect(platformField).toHaveAttribute("aria-readonly", "true");
    });

    it("should show current platform value in read-only field", () => {
      render(<EditEntryForm {...defaultProps} />);

      const platformField = elements.getPlatformField();
      expect(platformField).toHaveValue("PC");
    });

    it("should display explanatory message below platform field", () => {
      render(<EditEntryForm {...defaultProps} />);

      const message = elements.getPlatformMessage();
      expect(message).toBeInTheDocument();
      expect(message).toHaveClass("text-muted-foreground", "text-sm");
    });

    it("should apply disabled styling to platform field", () => {
      render(<EditEntryForm {...defaultProps} />);

      const platformField = elements.getPlatformField();
      expect(platformField).toHaveClass("cursor-not-allowed", "bg-muted");
    });

    it("should show 'Not specified' when platform is null", () => {
      const item = createMockLibraryItem({ platform: null });
      render(<EditEntryForm {...defaultProps} item={item} />);

      const platformField = elements.getPlatformField();
      expect(platformField).toHaveValue("Not specified");
    });

    it("should show different platform value for Nintendo Switch", () => {
      const item = createMockLibraryItem({ platform: "Nintendo Switch" });
      render(<EditEntryForm {...defaultProps} item={item} />);

      const platformField = elements.getPlatformField();
      expect(platformField).toHaveValue("Nintendo Switch");
    });
  });

  describe("Editable Fields in Edit Mode", () => {
    it("should allow editing status field in edit mode", () => {
      render(<EditEntryForm {...defaultProps} />);

      const statusTrigger = elements.getStatusTrigger();
      expect(statusTrigger).toBeEnabled();
    });

    it("should allow editing startedAt date field", () => {
      render(<EditEntryForm {...defaultProps} />);

      const startedAtField = elements.getStartedAtField();
      expect(startedAtField).toBeEnabled();
    });

    it("should allow editing completedAt date field", () => {
      render(<EditEntryForm {...defaultProps} />);

      const completedAtField = elements.getCompletedAtField();
      expect(completedAtField).toBeEnabled();
    });

    it("should display existing startedAt date when provided", () => {
      const startedDate = new Date("2025-01-20T00:00:00Z");
      const item = createMockLibraryItem({ startedAt: startedDate });
      render(<EditEntryForm {...defaultProps} item={item} />);

      const startedAtField = elements.getStartedAtField();
      expect(startedAtField).toHaveValue("2025-01-20");
    });

    it("should display existing completedAt date when provided", () => {
      const completedDate = new Date("2025-01-25T00:00:00Z");
      const item = createMockLibraryItem({ completedAt: completedDate });
      render(<EditEntryForm {...defaultProps} item={item} />);

      const completedAtField = elements.getCompletedAtField();
      expect(completedAtField).toHaveValue("2025-01-25");
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
      let resolveAction: (value: any) => void;
      const slowAction = new Promise((resolve) => {
        resolveAction = resolve;
      });

      mockUpdateLibraryEntryAction.mockReturnValue(slowAction as any);

      render(<EditEntryForm {...defaultProps} />);

      await userEvent.click(elements.getStatusTrigger());
      await userEvent.click(screen.getAllByText("Experienced")[0]);

      const submitPromise = userEvent.click(elements.getSubmitButton());

      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /updating/i });
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent("Updating...");
      });

      resolveAction!({ success: true, data: createMockLibraryItem() });
      await submitPromise;
    });
  });

  describe("Form Submission with Date Fields", () => {
    it("should submit updated status without dates", async () => {
      render(<EditEntryForm {...defaultProps} />);

      await actions.selectStatusAndSubmit("Experienced");

      await waitFor(() => {
        expect(mockUpdateLibraryEntryAction).toHaveBeenCalledWith({
          libraryItemId: 1,
          status: LibraryItemStatus.EXPERIENCED,
          startedAt: undefined,
          completedAt: undefined,
        });
      });
    });

    it("should submit with existing dates preserved", async () => {
      const startedDate = new Date("2025-01-20T00:00:00Z");
      const completedDate = new Date("2025-01-25T00:00:00Z");
      const item = createMockLibraryItem({
        startedAt: startedDate,
        completedAt: completedDate,
      });
      render(<EditEntryForm {...defaultProps} item={item} />);

      await actions.selectStatusAndSubmit("Experienced");

      await waitFor(() => {
        expect(mockUpdateLibraryEntryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            libraryItemId: 1,
            status: LibraryItemStatus.EXPERIENCED,
            startedAt: startedDate,
            completedAt: completedDate,
          })
        );
      });
    });

    it("should not include platform in submission data", async () => {
      const item = createMockLibraryItem({ platform: "PlayStation 5" });
      render(<EditEntryForm {...defaultProps} item={item} />);

      await actions.selectStatusAndSubmit("Experienced");

      await waitFor(() => {
        const callArgs = mockUpdateLibraryEntryAction.mock.calls[0][0];
        expect(callArgs).not.toHaveProperty("platform");
      });
    });
  });

  describe("given item with different platform", () => {
    it("should display Nintendo Switch in read-only field", () => {
      const item = createMockLibraryItem({ platform: "Nintendo Switch" });
      render(<EditEntryForm {...defaultProps} item={item} />);

      const platformField = elements.getPlatformField();
      expect(platformField).toHaveValue("Nintendo Switch");
      expect(platformField).toBeDisabled();
    });

    it("should display PlayStation 5 in metadata section", () => {
      const item = createMockLibraryItem({ platform: "PlayStation 5" });
      render(<EditEntryForm {...defaultProps} item={item} />);

      const metadataSection = elements.getMetadataSection();
      expect(
        within(metadataSection).getByText("PlayStation 5")
      ).toBeInTheDocument();
    });
  });
});
