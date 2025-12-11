import { renderWithTestProviders } from "@/test/utils/test-provider";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { toast } from "sonner";

import { ActionResult } from "@/shared/lib";
import {
  AcquisitionType,
  JournalMood,
  JournalVisibility,
  LibraryItemStatus,
  type JournalEntryDomain,
  type LibraryItemDomain,
} from "@/shared/types";

import { createJournalEntryAction } from "../server-actions/create-journal-entry";
import { getLibraryItemsByGameIdAction } from "../server-actions/get-library-items-by-game-id";
import { updateJournalEntryAction } from "../server-actions/update-journal-entry";
import { JournalEntryForm } from "./journal-entry-form";

// Mock RichTextEditor to render a simple textarea for testing
vi.mock("@/shared/components/rich-text-editor", () => ({
  RichTextEditor: ({
    value,
    onChange,
    placeholder,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
  }) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      aria-label="Content"
    />
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../server-actions/create-journal-entry", () => ({
  createJournalEntryAction: vi.fn(),
}));

vi.mock("../server-actions/get-library-items-by-game-id", () => ({
  getLibraryItemsByGameIdAction: vi.fn(),
}));

vi.mock("../server-actions/update-journal-entry", () => ({
  updateJournalEntryAction: vi.fn(),
}));

const mockCreateJournalEntryAction = vi.mocked(createJournalEntryAction);
const mockUpdateJournalEntryAction = vi.mocked(updateJournalEntryAction);
const mockGetLibraryItemsByGameIdAction = vi.mocked(
  getLibraryItemsByGameIdAction
);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const mockJournalEntry: JournalEntryDomain = {
  id: "entry-1",
  userId: "user-1",
  gameId: "game-1",
  libraryItemId: null,
  title: "Test Entry",
  content: "Test content",
  mood: null,
  playSession: null,
  visibility: JournalVisibility.PRIVATE,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  publishedAt: null,
};

const elements = {
  getTitleInput: () => screen.getByLabelText(/^title/i),
  getContentTextarea: () => screen.getByTestId("rich-text-editor"),
  getMoodSelect: () => screen.getByRole("combobox", { name: /mood/i }),
  getHoursPlayedInput: () => screen.getByLabelText(/hours played/i),
  getLibraryItemSelect: () =>
    screen.queryByRole("combobox", { name: /link to library item/i }),
  getSubmitButton: () =>
    screen.queryByRole("button", { name: /create entry/i }) ||
    screen.getByRole("button", { name: /save changes/i }),
  getSaveButton: () => screen.getByRole("button", { name: /save changes/i }),
  getCancelButton: () => screen.queryByRole("button", { name: /cancel/i }),
  getCreatingButton: () => screen.queryByRole("button", { name: /creating/i }),
  getSavingButton: () => screen.queryByRole("button", { name: /saving/i }),
  getTitleError: () => screen.queryByText(/title is required/i),
  getContentError: () => screen.queryByText(/content is required/i),
  getAutoLinkMessage: () =>
    screen.queryByText(/automatically linked to your library item/i),
};

const actions = {
  typeTitle: async (value: string) => {
    await userEvent.type(elements.getTitleInput(), value);
  },
  typeContent: async (value: string) => {
    await userEvent.type(elements.getContentTextarea(), value);
  },
  selectMood: async (mood: string) => {
    await userEvent.click(elements.getMoodSelect());
    await userEvent.click(screen.getByRole("option", { name: mood }));
  },
  typeHoursPlayed: async (value: string) => {
    await userEvent.type(elements.getHoursPlayedInput(), value);
  },
  submitForm: async () => {
    const submitButton =
      screen.queryByRole("button", { name: /create entry/i }) ||
      screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);
  },
  clickCancel: async () => {
    const cancelButton = elements.getCancelButton();
    if (cancelButton) {
      await userEvent.click(cancelButton);
    }
  },
};

describe("JournalEntryForm", () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateJournalEntryAction.mockResolvedValue({
      success: true,
      data: mockJournalEntry,
    });
    mockGetLibraryItemsByGameIdAction.mockResolvedValue({
      success: true,
      data: [],
    });
  });

  describe("given component rendered in create mode", () => {
    beforeEach(() => {
      renderWithTestProviders(
        <JournalEntryForm gameId="game-1" onSuccess={mockOnSuccess} />
      );
    });

    it("should display all form fields", () => {
      expect(elements.getTitleInput()).toBeVisible();
      expect(elements.getContentTextarea()).toBeVisible();
      expect(elements.getMoodSelect()).toBeVisible();
      expect(elements.getHoursPlayedInput()).toBeVisible();
      expect(elements.getSubmitButton()).toBeVisible();
    });

    it("should show 'Create Entry' button text", () => {
      expect(elements.getSubmitButton()).toHaveTextContent("Create Entry");
    });

    describe("when form is submitted with empty required fields", () => {
      it("should display validation errors for title and content", async () => {
        await actions.submitForm();

        await waitFor(() => {
          expect(elements.getTitleError()).toBeVisible();
          expect(elements.getContentError()).toBeVisible();
        });
      });

      it("should not call createJournalEntryAction", async () => {
        await actions.submitForm();

        await waitFor(() => {
          expect(elements.getTitleError()).toBeVisible();
        });

        expect(mockCreateJournalEntryAction).not.toHaveBeenCalled();
      });
    });

    describe("when form is submitted with valid data", () => {
      beforeEach(async () => {
        await actions.typeTitle("My First Entry");
        await actions.typeContent("This is my journal entry content.");
      });

      it("should call createJournalEntryAction with correct data", async () => {
        await actions.submitForm();

        await waitFor(() => {
          expect(mockCreateJournalEntryAction).toHaveBeenCalledWith({
            gameId: "game-1",
            title: "My First Entry",
            content: "This is my journal entry content.",
            mood: undefined,
            playSession: undefined,
            libraryItemId: undefined,
          });
        });
      });

      it("should show loading state during submission", async () => {
        let resolveAction: (value: ActionResult<JournalEntryDomain>) => void;
        const pendingAction = new Promise<ActionResult<JournalEntryDomain>>(
          (resolve) => {
            resolveAction = resolve;
          }
        );
        mockCreateJournalEntryAction.mockReturnValueOnce(pendingAction);

        actions.submitForm();

        await waitFor(() => {
          expect(elements.getCreatingButton()).toBeVisible();
        });

        resolveAction!({ success: true, data: mockJournalEntry });
        await pendingAction;
      });

      it("should call onSuccess callback on successful submission", async () => {
        await actions.submitForm();

        await waitFor(() => {
          expect(mockOnSuccess).toHaveBeenCalledWith(mockJournalEntry);
        });
      });

      it("should show success toast on successful submission", async () => {
        await actions.submitForm();

        await waitFor(() => {
          expect(mockToastSuccess).toHaveBeenCalledWith(
            "Journal entry created",
            { description: "Your journal entry has been created." }
          );
        });
      });

      it("should show error toast on failed submission", async () => {
        mockCreateJournalEntryAction.mockResolvedValueOnce({
          success: false,
          error: "Failed to create entry",
        });

        await actions.submitForm();

        await waitFor(() => {
          expect(mockToastError).toHaveBeenCalledWith(
            "Failed to create entry",
            { description: "Failed to create entry" }
          );
        });
      });
    });

    describe("when optional fields are filled", () => {
      beforeEach(async () => {
        await actions.typeTitle("Entry with Options");
        await actions.typeContent("Content here");
      });

      it("should submit with mood selected", async () => {
        await actions.selectMood("Excited");

        await actions.submitForm();

        await waitFor(() => {
          expect(mockCreateJournalEntryAction).toHaveBeenCalledWith(
            expect.objectContaining({
              mood: JournalMood.EXCITED,
            })
          );
        });
      });

      it("should submit with hours played", async () => {
        await actions.typeHoursPlayed("5");

        await actions.submitForm();

        await waitFor(() => {
          expect(mockCreateJournalEntryAction).toHaveBeenCalledWith(
            expect.objectContaining({
              playSession: 5,
            })
          );
        });
      });
    });
  });

  describe("given component rendered with library items", () => {
    describe("when user has exactly one library item", () => {
      beforeEach(() => {
        const mockLibraryItem: LibraryItemDomain = {
          id: 1,
          platform: "Steam",
          userId: "user-1",
          gameId: "game-1",
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          acquisitionType: AcquisitionType.DIGITAL,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockGetLibraryItemsByGameIdAction.mockResolvedValue({
          success: true,
          data: [mockLibraryItem],
        });

        renderWithTestProviders(
          <JournalEntryForm gameId="game-1" onSuccess={mockOnSuccess} />
        );
      });

      it("should auto-link library item", async () => {
        await waitFor(() => {
          expect(mockGetLibraryItemsByGameIdAction).toHaveBeenCalledWith({
            gameId: "game-1",
          });
        });

        await actions.typeTitle("Test");
        await actions.typeContent("Content");

        await actions.submitForm();

        await waitFor(() => {
          expect(mockCreateJournalEntryAction).toHaveBeenCalledWith(
            expect.objectContaining({
              libraryItemId: 1,
            })
          );
        });
      });

      it("should not show library item selector when auto-linked", async () => {
        // When there's exactly one library item, it's auto-linked silently
        // and the selector is not shown
        await waitFor(() => {
          expect(mockGetLibraryItemsByGameIdAction).toHaveBeenCalled();
        });
        expect(elements.getLibraryItemSelect()).not.toBeInTheDocument();
      });
    });

    describe("when user has multiple library items", () => {
      beforeEach(() => {
        const mockLibraryItems: LibraryItemDomain[] = [
          {
            id: 1,
            platform: "Steam",
            userId: "user-1",
            gameId: "game-1",
            status: LibraryItemStatus.CURRENTLY_EXPLORING,
            acquisitionType: AcquisitionType.DIGITAL,
            startedAt: null,
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            platform: "Epic Games",
            userId: "user-1",
            gameId: "game-1",
            status: LibraryItemStatus.EXPERIENCED,
            acquisitionType: AcquisitionType.DIGITAL,
            startedAt: null,
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockGetLibraryItemsByGameIdAction.mockResolvedValue({
          success: true,
          data: mockLibraryItems,
        });

        renderWithTestProviders(
          <JournalEntryForm gameId="game-1" onSuccess={mockOnSuccess} />
        );
      });

      it("should show library item selector", async () => {
        await waitFor(() => {
          expect(elements.getLibraryItemSelect()).toBeVisible();
        });
      });

      it("should allow selecting a library item", async () => {
        await waitFor(() => {
          expect(elements.getLibraryItemSelect()).toBeVisible();
        });

        await userEvent.click(elements.getLibraryItemSelect()!);
        await userEvent.click(screen.getByRole("option", { name: /steam/i }));

        await actions.typeTitle("Test");
        await actions.typeContent("Content");

        await actions.submitForm();

        await waitFor(() => {
          expect(mockCreateJournalEntryAction).toHaveBeenCalledWith(
            expect.objectContaining({
              libraryItemId: 1,
            })
          );
        });
      });
    });
  });

  describe("given component rendered in edit mode", () => {
    beforeEach(() => {
      renderWithTestProviders(
        <JournalEntryForm
          gameId="game-1"
          entry={mockJournalEntry}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
    });

    it("should pre-populate form fields with entry data", async () => {
      await waitFor(() => {
        expect(elements.getTitleInput()).toHaveValue("Test Entry");
        expect(elements.getContentTextarea()).toHaveValue("Test content");
      });
    });

    it("should show 'Save Changes' button text", () => {
      expect(elements.getSaveButton()).toBeVisible();
      expect(elements.getSaveButton()).toHaveTextContent("Save Changes");
    });

    it("should call onCancel when cancel button is clicked", async () => {
      await actions.clickCancel();

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("should call updateJournalEntryAction on form submission", async () => {
      mockUpdateJournalEntryAction.mockResolvedValue({
        success: true,
        data: mockJournalEntry,
      });

      // Clear existing values before typing new ones
      await userEvent.clear(elements.getTitleInput());
      await userEvent.clear(elements.getContentTextarea());
      await actions.typeTitle("Updated Title");
      await actions.typeContent("Updated content");
      await actions.submitForm();

      await waitFor(() => {
        expect(mockUpdateJournalEntryAction).toHaveBeenCalledWith({
          entryId: "entry-1",
          title: "Updated Title",
          content: "Updated content",
          mood: undefined,
          playSession: undefined,
          libraryItemId: undefined,
        });
      });
    });

    it("should call onSuccess after successful update", async () => {
      mockUpdateJournalEntryAction.mockResolvedValue({
        success: true,
        data: mockJournalEntry,
      });

      await actions.submitForm();

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockJournalEntry);
      });
    });

    it("should show success toast after successful update", async () => {
      mockUpdateJournalEntryAction.mockResolvedValue({
        success: true,
        data: mockJournalEntry,
      });

      await actions.submitForm();

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Journal entry updated", {
          description: "Your journal entry has been updated.",
        });
      });
    });

    it("should show error toast when update fails", async () => {
      mockUpdateJournalEntryAction.mockResolvedValue({
        success: false,
        error: "Update failed",
      });

      await actions.submitForm();

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to update entry", {
          description: "Update failed",
        });
      });
    });

    it("should include mood in update payload when mood is selected", async () => {
      mockUpdateJournalEntryAction.mockResolvedValue({
        success: true,
        data: mockJournalEntry,
      });

      await actions.selectMood("Excited");
      await actions.submitForm();

      await waitFor(() => {
        expect(mockUpdateJournalEntryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            mood: JournalMood.EXCITED,
          })
        );
      });
    });

    it("should include playSession in update payload when hours played is entered", async () => {
      mockUpdateJournalEntryAction.mockResolvedValue({
        success: true,
        data: mockJournalEntry,
      });

      await actions.typeHoursPlayed("5");
      await actions.submitForm();

      await waitFor(() => {
        expect(mockUpdateJournalEntryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            playSession: 5,
          })
        );
      });
    });
  });

  describe("given component rendered with onCancel prop", () => {
    beforeEach(() => {
      renderWithTestProviders(
        <JournalEntryForm
          gameId="game-1"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
    });

    it("should display cancel button", () => {
      expect(elements.getCancelButton()).toBeVisible();
    });

    it("should call onCancel when cancel button is clicked", async () => {
      await actions.clickCancel();

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe("given component rendered without onCancel prop", () => {
    beforeEach(() => {
      renderWithTestProviders(
        <JournalEntryForm gameId="game-1" onSuccess={mockOnSuccess} />
      );
    });

    it("should not display cancel button", () => {
      expect(elements.getCancelButton()).not.toBeInTheDocument();
    });
  });
});
