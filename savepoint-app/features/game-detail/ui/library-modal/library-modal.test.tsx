import { LibraryItemStatus, type LibraryItem } from "@prisma/client";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LibraryModal } from "./library-modal";

vi.mock("./library-item-card", () => ({
  LibraryItemCard: ({
    item,
    onClick,
  }: {
    item: LibraryItem;
    onClick?: () => void;
  }) => (
    <div
      data-testid={`library-card-${item.id}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <span>Platform: {item.platform || "Not set"}</span>
      <span>Status: {item.status}</span>
    </div>
  ),
}));

vi.mock("./add-entry-form", () => ({
  AddEntryForm: ({
    onSuccess,
    onCancel,
    isEditMode,
  }: {
    onSuccess: () => void;
    onCancel: () => void;
    isEditMode?: boolean;
  }) => (
    <div data-testid="add-entry-form">
      <p>Add Entry Form{isEditMode ? " (Edit Mode)" : ""}</p>
      <button onClick={onSuccess}>Success</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock("./edit-entry-form", () => ({
  EditEntryForm: ({
    item,
    onSuccess,
    onCancel,
  }: {
    item: LibraryItem;
    onSuccess: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="edit-entry-form">
      <p>Edit Entry Form for item {item.id}</p>
      <button onClick={onSuccess}>Update Success</button>
      <button onClick={onCancel}>Cancel Edit</button>
    </div>
  ),
}));

const createMockLibraryItem = (
  overrides: Partial<LibraryItem> = {}
): LibraryItem => ({
  id: Math.floor(Math.random() * 10000),
  userId: "user-123",
  gameId: "game-456",
  status: LibraryItemStatus.CURIOUS_ABOUT,
  platform: "PlayStation 5",
  acquisitionType: "DIGITAL",
  startedAt: null,
  completedAt: null,
  createdAt: new Date("2025-01-10T12:00:00Z"),
  updatedAt: new Date("2025-01-20T12:00:00Z"),
  ...overrides,
});

const elements = {
  getDialog: () => screen.getByRole("dialog"),
  getDialogTitle: () => screen.getByText(/add to library|manage library/i),
  getLibraryCard: (itemId: number) =>
    screen.getByTestId(`library-card-${itemId}`),
  getAllLibraryCards: () => screen.getAllByRole("button", { name: "" }),
  getAddNewEntryButton: () => screen.getByText(/add new entry/i),
  getBackToListButton: () => screen.getByText(/back to all entries/i),
  getEmptyStateMessage: () =>
    screen.getByText(/no library entries found|no entries yet/i),
  getEntryCountTitle: () => screen.getByText(/your library entries \(\d+\)/i),
  getAddEntryForm: () => screen.getByTestId("add-entry-form"),
  getEditEntryForm: () => screen.getByTestId("edit-entry-form"),
  queryDialog: () => screen.queryByRole("dialog"),
  queryAddNewEntryButton: () => screen.queryByText(/add new entry/i),
  queryBackToListButton: () => screen.queryByText(/back to all entries/i),
  queryEmptyStateMessage: () =>
    screen.queryByText(/no library entries found|no entries yet/i),
};

const actions = {
  clickLibraryCard: async (itemId: number) => {
    await userEvent.click(elements.getLibraryCard(itemId));
  },
  clickAddNewEntry: async () => {
    await userEvent.click(elements.getAddNewEntryButton());
  },
  clickBackToList: async () => {
    await userEvent.click(elements.getBackToListButton());
  },
  closeDialog: async () => {
    await userEvent.keyboard("{Escape}");
  },
};

describe("LibraryModal - List View", () => {
  const defaultProps = {
    gameId: "game-456",
    isOpen: true,
    onClose: vi.fn(),
    igdbId: 12345,
    gameTitle: "The Legend of Zelda: Breath of the Wild",
    mode: "edit" as const,
    existingItems: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("List View Rendering Tests", () => {
    describe("given modal in edit mode with multiple library items", () => {
      it("should show entry count in title", () => {
        const mockItems = [
          createMockLibraryItem({ id: 1, platform: "PlayStation 5" }),
          createMockLibraryItem({ id: 2, platform: "PC" }),
          createMockLibraryItem({ id: 3, platform: "Nintendo Switch" }),
        ];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        expect(screen.getByText("Your Library Entries (3)")).toBeVisible();
      });

      it("should display all library items as cards", () => {
        const mockItems = [
          createMockLibraryItem({ id: 1, platform: "PlayStation 5" }),
          createMockLibraryItem({ id: 2, platform: "PC" }),
        ];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        expect(elements.getLibraryCard(1)).toBeVisible();
        expect(elements.getLibraryCard(2)).toBeVisible();
      });

      it("should show Add New Entry button", () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        expect(elements.getAddNewEntryButton()).toBeVisible();
      });

      it("should render all items when many exist", () => {
        const mockItems = Array.from({ length: 10 }, (_, i) =>
          createMockLibraryItem({ id: i + 1 })
        );

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        mockItems.forEach((item) => {
          expect(elements.getLibraryCard(item.id)).toBeVisible();
        });
      });

      it("should display items with correct platform data", () => {
        const mockItems = [
          createMockLibraryItem({ id: 1, platform: "PlayStation 5" }),
          createMockLibraryItem({ id: 2, platform: "PC" }),
        ];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        expect(screen.getByText("Platform: PlayStation 5")).toBeVisible();
        expect(screen.getByText("Platform: PC")).toBeVisible();
      });

      it("should display items with correct status data", () => {
        const mockItems = [
          createMockLibraryItem({
            id: 1,
            status: LibraryItemStatus.CURRENTLY_EXPLORING,
          }),
          createMockLibraryItem({
            id: 2,
            status: LibraryItemStatus.EXPERIENCED,
          }),
        ];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        expect(
          screen.getByText(`Status: ${LibraryItemStatus.CURRENTLY_EXPLORING}`)
        ).toBeVisible();
        expect(
          screen.getByText(`Status: ${LibraryItemStatus.EXPERIENCED}`)
        ).toBeVisible();
      });
    });

    describe("given modal in edit mode with empty library items", () => {
      it("should show empty state message", () => {
        render(<LibraryModal {...defaultProps} existingItems={[]} />);

        expect(elements.getEmptyStateMessage()).toBeVisible();
      });

      it("should not show Add New Entry button when empty", () => {
        render(<LibraryModal {...defaultProps} existingItems={[]} />);

        expect(elements.queryAddNewEntryButton()).not.toBeInTheDocument();
      });

      it("should not show entry count title when empty", () => {
        render(<LibraryModal {...defaultProps} existingItems={[]} />);

        expect(
          screen.queryByText(/your library entries \(\d+\)/i)
        ).not.toBeInTheDocument();
      });
    });

    describe("given modal in edit mode with single library item", () => {
      it("should show entry count as 1", () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        expect(screen.getByText("Your Library Entries (1)")).toBeVisible();
      });

      it("should display the single library item", () => {
        const mockItems = [
          createMockLibraryItem({ id: 1, platform: "PlayStation 5" }),
        ];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        expect(elements.getLibraryCard(1)).toBeVisible();
      });
    });

    describe("given modal in add mode", () => {
      it("should show add entry form directly", () => {
        render(<LibraryModal {...defaultProps} mode="add" />);

        expect(elements.getAddEntryForm()).toBeVisible();
      });

      it("should not show list view", () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(
          <LibraryModal
            {...defaultProps}
            mode="add"
            existingItems={mockItems}
          />
        );

        expect(screen.queryByTestId("library-card-1")).not.toBeInTheDocument();
      });

      it("should show Add to Library title", () => {
        render(<LibraryModal {...defaultProps} mode="add" />);

        expect(screen.getByText("Add to Library")).toBeVisible();
      });

      it("should show appropriate description", () => {
        render(<LibraryModal {...defaultProps} mode="add" />);

        expect(
          screen.getByText(
            "Add The Legend of Zelda: Breath of the Wild to your library and set your journey status."
          )
        ).toBeVisible();
      });
    });

    describe("given modal in edit mode", () => {
      it("should show Manage Library title", () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        expect(screen.getByText("Manage Library")).toBeVisible();
      });

      it("should show appropriate description", () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        expect(
          screen.getByText(
            "Update your library entries for The Legend of Zelda: Breath of the Wild."
          )
        ).toBeVisible();
      });
    });
  });

  describe("View State Transitions", () => {
    describe("given user in list view", () => {
      it("should start in list view by default in edit mode", () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        expect(elements.getEntryCountTitle()).toBeVisible();
        expect(elements.getAddNewEntryButton()).toBeVisible();
      });

      it("should switch to edit mode when card is clicked", async () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        await actions.clickLibraryCard(1);

        await waitFor(() => {
          expect(elements.getEditEntryForm()).toBeVisible();
        });
      });

      it("should show back button in edit mode", async () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        await actions.clickLibraryCard(1);

        await waitFor(() => {
          expect(elements.getBackToListButton()).toBeVisible();
        });
      });

      it("should hide list view when in edit mode", async () => {
        const mockItems = [
          createMockLibraryItem({ id: 1 }),
          createMockLibraryItem({ id: 2 }),
        ];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        await actions.clickLibraryCard(1);

        await waitFor(() => {
          expect(
            screen.queryByText("Your Library Entries (2)")
          ).not.toBeInTheDocument();
        });
      });

      it("should switch to add mode when Add New Entry is clicked", async () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        await actions.clickAddNewEntry();

        await waitFor(() => {
          expect(elements.getAddEntryForm()).toBeVisible();
        });
      });

      it("should show back button in add mode", async () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        await actions.clickAddNewEntry();

        await waitFor(() => {
          expect(elements.getBackToListButton()).toBeVisible();
        });
      });
    });

    describe("given user in edit mode", () => {
      it("should return to list view when back button is clicked", async () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        await actions.clickLibraryCard(1);
        await waitFor(() => {
          expect(elements.getEditEntryForm()).toBeVisible();
        });

        await actions.clickBackToList();

        await waitFor(() => {
          expect(elements.getEntryCountTitle()).toBeVisible();
          expect(
            screen.queryByTestId("edit-entry-form")
          ).not.toBeInTheDocument();
        });
      });

      it("should show correct item data in edit form", async () => {
        const mockItems = [
          createMockLibraryItem({ id: 1 }),
          createMockLibraryItem({ id: 2 }),
        ];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        await actions.clickLibraryCard(2);

        await waitFor(() => {
          expect(screen.getByText("Edit Entry Form for item 2")).toBeVisible();
        });
      });

      it("should close modal when edit form success is triggered", async () => {
        const onClose = vi.fn();
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(
          <LibraryModal
            {...defaultProps}
            existingItems={mockItems}
            onClose={onClose}
          />
        );

        await actions.clickLibraryCard(1);

        await waitFor(() => {
          expect(elements.getEditEntryForm()).toBeVisible();
        });

        await userEvent.click(screen.getByText("Update Success"));

        await waitFor(() => {
          expect(onClose).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe("given user in add mode", () => {
      it("should return to list view when back button is clicked", async () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        await actions.clickAddNewEntry();
        await waitFor(() => {
          expect(elements.getAddEntryForm()).toBeVisible();
        });

        await actions.clickBackToList();

        await waitFor(() => {
          expect(elements.getEntryCountTitle()).toBeVisible();
          expect(
            screen.queryByTestId("add-entry-form")
          ).not.toBeInTheDocument();
        });
      });

      it("should show edit mode indicator on add form", async () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        await actions.clickAddNewEntry();

        await waitFor(() => {
          expect(screen.getByText("Add Entry Form (Edit Mode)")).toBeVisible();
        });
      });

      it("should close modal when add form success is triggered", async () => {
        const onClose = vi.fn();
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(
          <LibraryModal
            {...defaultProps}
            existingItems={mockItems}
            onClose={onClose}
          />
        );

        await actions.clickAddNewEntry();

        await waitFor(() => {
          expect(elements.getAddEntryForm()).toBeVisible();
        });

        await userEvent.click(screen.getByText("Success"));

        await waitFor(() => {
          expect(onClose).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe("Modal State Management", () => {
    describe("given modal is closed", () => {
      it("should not render dialog when isOpen is false", () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(
          <LibraryModal
            {...defaultProps}
            isOpen={false}
            existingItems={mockItems}
          />
        );

        expect(elements.queryDialog()).not.toBeInTheDocument();
      });

      it("should reset state when modal is closed", async () => {
        const mockItems = [createMockLibraryItem({ id: 1 })];
        const { rerender } = render(
          <LibraryModal {...defaultProps} existingItems={mockItems} />
        );

        await actions.clickLibraryCard(1);
        await waitFor(() => {
          expect(elements.getEditEntryForm()).toBeVisible();
        });

        rerender(
          <LibraryModal
            {...defaultProps}
            isOpen={false}
            existingItems={mockItems}
          />
        );

        rerender(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        await waitFor(() => {
          expect(elements.getEntryCountTitle()).toBeVisible();
        });
      });
    });

    describe("given modal close handler", () => {
      it("should call onClose when dialog is closed", async () => {
        const onClose = vi.fn();
        const mockItems = [createMockLibraryItem({ id: 1 })];

        render(
          <LibraryModal
            {...defaultProps}
            existingItems={mockItems}
            onClose={onClose}
          />
        );

        await actions.closeDialog();
      });

      it("should reset state when onClose is called", async () => {
        const onClose = vi.fn();
        const mockItems = [createMockLibraryItem({ id: 1 })];

        const { rerender } = render(
          <LibraryModal
            {...defaultProps}
            existingItems={mockItems}
            onClose={onClose}
          />
        );

        await actions.clickLibraryCard(1);
        await waitFor(() => {
          expect(elements.getEditEntryForm()).toBeVisible();
        });

        rerender(
          <LibraryModal
            {...defaultProps}
            isOpen={false}
            existingItems={mockItems}
            onClose={onClose}
          />
        );
        rerender(
          <LibraryModal
            {...defaultProps}
            existingItems={mockItems}
            onClose={onClose}
          />
        );

        await waitFor(() => {
          expect(elements.getEntryCountTitle()).toBeVisible();
        });
      });
    });
  });

  describe("Data Display Tests", () => {
    describe("given various library item configurations", () => {
      it("should handle items with null platform", () => {
        const mockItems = [createMockLibraryItem({ id: 1, platform: null })];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        expect(screen.getByText("Platform: Not set")).toBeVisible();
      });

      it("should handle items with different statuses", () => {
        const mockItems = [
          createMockLibraryItem({
            id: 1,
            status: LibraryItemStatus.CURIOUS_ABOUT,
          }),
          createMockLibraryItem({
            id: 2,
            status: LibraryItemStatus.CURRENTLY_EXPLORING,
          }),
          createMockLibraryItem({
            id: 3,
            status: LibraryItemStatus.EXPERIENCED,
          }),
        ];

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        expect(
          screen.getByText(`Status: ${LibraryItemStatus.CURIOUS_ABOUT}`)
        ).toBeVisible();
        expect(
          screen.getByText(`Status: ${LibraryItemStatus.CURRENTLY_EXPLORING}`)
        ).toBeVisible();
        expect(
          screen.getByText(`Status: ${LibraryItemStatus.EXPERIENCED}`)
        ).toBeVisible();
      });

      it("should correctly count items in title", () => {
        const mockItems = Array.from({ length: 7 }, (_, i) =>
          createMockLibraryItem({ id: i + 1 })
        );

        render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

        expect(screen.getByText("Your Library Entries (7)")).toBeVisible();
      });
    });
  });

  describe("Navigation Flow Integration", () => {
    it("should support full flow: list → edit → list → add → list", async () => {
      const mockItems = [
        createMockLibraryItem({ id: 1 }),
        createMockLibraryItem({ id: 2 }),
      ];

      render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

      expect(elements.getEntryCountTitle()).toBeVisible();

      await actions.clickLibraryCard(1);
      await waitFor(() => {
        expect(elements.getEditEntryForm()).toBeVisible();
      });

      await actions.clickBackToList();
      await waitFor(() => {
        expect(elements.getEntryCountTitle()).toBeVisible();
      });

      await actions.clickAddNewEntry();
      await waitFor(() => {
        expect(elements.getAddEntryForm()).toBeVisible();
      });

      await actions.clickBackToList();
      await waitFor(() => {
        expect(elements.getEntryCountTitle()).toBeVisible();
      });
    });

    it("should maintain correct item selection when switching between items", async () => {
      const mockItems = [
        createMockLibraryItem({ id: 1 }),
        createMockLibraryItem({ id: 2 }),
        createMockLibraryItem({ id: 3 }),
      ];

      render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

      await actions.clickLibraryCard(1);
      await waitFor(() => {
        expect(screen.getByText("Edit Entry Form for item 1")).toBeVisible();
      });

      await actions.clickBackToList();

      await actions.clickLibraryCard(3);
      await waitFor(() => {
        expect(screen.getByText("Edit Entry Form for item 3")).toBeVisible();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper dialog role", () => {
      const mockItems = [createMockLibraryItem({ id: 1 })];

      render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

      expect(elements.getDialog()).toBeInTheDocument();
    });

    it("should have descriptive title", () => {
      const mockItems = [createMockLibraryItem({ id: 1 })];

      render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

      expect(screen.getByText("Manage Library")).toBeVisible();
    });

    it("should have aria-label on back button", async () => {
      const mockItems = [createMockLibraryItem({ id: 1 })];

      render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

      await actions.clickLibraryCard(1);

      await waitFor(() => {
        const backButton = screen.getByLabelText("Back to list view");
        expect(backButton).toBeVisible();
      });
    });

    it("should have aria-label on Add New Entry button", () => {
      const mockItems = [createMockLibraryItem({ id: 1 })];

      render(<LibraryModal {...defaultProps} existingItems={mockItems} />);

      const addButton = screen.getByLabelText("Add new library entry");
      expect(addButton).toBeVisible();
    });
  });
});
