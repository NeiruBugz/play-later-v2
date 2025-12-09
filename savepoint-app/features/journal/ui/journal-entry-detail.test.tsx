import { renderWithTestProviders } from "@/test/utils/test-provider";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { JournalMood, type JournalEntryDomain } from "@/shared/types";

import { deleteJournalEntryAction } from "../server-actions/delete-journal-entry";
import { JournalEntryDetail } from "./journal-entry-detail";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  })),
}));

vi.mock("../server-actions/delete-journal-entry", () => ({
  deleteJournalEntryAction: vi.fn(),
}));

vi.mock("@/shared/lib/date", () => ({
  formatRelativeDate: vi.fn((date: Date) => {
    const now = new Date("2025-01-27T12:00:00Z");
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "today";
    if (diffInDays === 1) return "yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }),
  formatAbsoluteDate: vi.fn((date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }),
}));

const createMockEntry = (
  overrides: Partial<JournalEntryDomain> = {}
): JournalEntryDomain => ({
  id: "entry-1",
  userId: "user-1",
  gameId: "game-1",
  libraryItemId: null,
  title: "My First Entry",
  content: "This is my journal entry content.",
  mood: null,
  playSession: null,
  visibility: "PRIVATE",
  createdAt: new Date("2025-01-27T12:00:00Z"),
  updatedAt: new Date("2025-01-27T12:00:00Z"),
  publishedAt: null,
  ...overrides,
});

const createMockGame = (
  overrides: Partial<{
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
  }> = {}
) => ({
  id: "game-1",
  title: "Test Game",
  slug: "test-game",
  coverImage: "cover123",
  ...overrides,
});

const mockDeleteJournalEntryAction = vi.mocked(deleteJournalEntryAction);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const elements = {
  getTitle: () => screen.getByRole("heading", { level: 1 }),
  getCreatedDate: () => screen.getByText(/created/i),
  getUpdatedDate: () => screen.queryByText(/updated/i),
  getContent: () => screen.getByText("This is my journal entry content."),
  getGameCard: () => screen.getByText("Test Game"),
  getMoodBadge: () =>
    screen.queryByText(
      /excited|relaxed|frustrated|accomplished|curious|nostalgic/i
    ),
  getHoursPlayedBadge: () => screen.queryByText(/\d+ hours/i),
  getEditButton: () => screen.getByRole("link", { name: /edit/i }),
  getDeleteButton: () => screen.getByRole("button", { name: /delete/i }),
  getGameCardTitle: () => screen.getByText("Game"),
  getEntryCardTitle: () => screen.getByText("Entry"),
  getDeleteDialog: () => screen.queryByRole("dialog"),
  getDeleteDialogTitle: () => screen.queryByText("Delete Journal Entry"),
  getDeleteDialogDescription: () =>
    screen.queryByText(/are you sure you want to delete/i),
  getDeleteConfirmButton: () =>
    screen.queryByRole("button", { name: /^delete$/i }),
  getDeleteCancelButton: () =>
    screen.queryByRole("button", { name: /cancel/i }),
};

const actions = {
  clickDeleteButton: async () => {
    await userEvent.click(elements.getDeleteButton());
  },
  clickDeleteConfirm: async () => {
    const confirmButton = elements.getDeleteConfirmButton();
    if (confirmButton) {
      await userEvent.click(confirmButton);
    }
  },
  clickDeleteCancel: async () => {
    const cancelButton = elements.getDeleteCancelButton();
    if (cancelButton) {
      await userEvent.click(cancelButton);
    }
  },
};

describe("JournalEntryDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockBack.mockClear();
  });

  describe("given component rendered with complete entry", () => {
    const entry = createMockEntry();
    const game = createMockGame();

    beforeEach(() => {
      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);
    });

    it("should display entry title", () => {
      expect(elements.getTitle()).toHaveTextContent("My First Entry");
    });

    it("should display created date", () => {
      expect(elements.getCreatedDate()).toBeVisible();
    });

    it("should display entry content", () => {
      expect(elements.getContent()).toBeVisible();
    });

    it("should display game information card", () => {
      expect(elements.getGameCardTitle()).toBeVisible();
      expect(elements.getGameCard()).toBeVisible();
    });

    it("should display entry card", () => {
      expect(elements.getEntryCardTitle()).toBeVisible();
    });

    it("should display edit button", () => {
      const editButton = elements.getEditButton();
      expect(editButton).toBeVisible();
      expect(editButton).toHaveAttribute("href", "/journal/entry-1/edit");
    });

    it("should display delete button as enabled", () => {
      const deleteButton = elements.getDeleteButton();
      expect(deleteButton).toBeVisible();
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe("given entry with title", () => {
    it("should display the title", () => {
      const entry = createMockEntry({ title: "My Journal Entry" });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getTitle()).toHaveTextContent("My Journal Entry");
    });
  });

  describe("given entry without title", () => {
    it("should display 'Untitled Entry' as fallback", () => {
      const entry = createMockEntry({ title: null });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getTitle()).toHaveTextContent("Untitled Entry");
    });
  });

  describe("given entry with same created and updated dates", () => {
    it("should not display updated date", () => {
      const entry = createMockEntry({
        createdAt: new Date("2025-01-27T12:00:00Z"),
        updatedAt: new Date("2025-01-27T12:00:00Z"),
      });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getUpdatedDate()).not.toBeInTheDocument();
    });
  });

  describe("given entry with different created and updated dates", () => {
    it("should display both created and updated dates", () => {
      const entry = createMockEntry({
        createdAt: new Date("2025-01-20T12:00:00Z"),
        updatedAt: new Date("2025-01-27T12:00:00Z"),
      });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getCreatedDate()).toBeVisible();
      expect(elements.getUpdatedDate()).toBeVisible();
    });
  });

  describe("given entry with mood", () => {
    it("should display mood badge", () => {
      const entry = createMockEntry({ mood: JournalMood.EXCITED });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getMoodBadge()).toBeVisible();
      expect(elements.getMoodBadge()).toHaveTextContent("Excited");
    });

    it.each([
      [JournalMood.EXCITED, "Excited"],
      [JournalMood.RELAXED, "Relaxed"],
      [JournalMood.FRUSTRATED, "Frustrated"],
      [JournalMood.ACCOMPLISHED, "Accomplished"],
      [JournalMood.CURIOUS, "Curious"],
      [JournalMood.NOSTALGIC, "Nostalgic"],
    ])("should display correct label for %s mood", (mood, label) => {
      const entry = createMockEntry({ mood });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getMoodBadge()).toHaveTextContent(label);
    });
  });

  describe("given entry without mood", () => {
    it("should not display mood badge", () => {
      const entry = createMockEntry({ mood: null });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getMoodBadge()).not.toBeInTheDocument();
    });
  });

  describe("given entry with hours played", () => {
    it("should display hours played badge", () => {
      const entry = createMockEntry({ playSession: 5 });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getHoursPlayedBadge()).toBeVisible();
      expect(elements.getHoursPlayedBadge()).toHaveTextContent("5 hours");
    });

    it("should display correct hours for different values", () => {
      const entry = createMockEntry({ playSession: 10 });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getHoursPlayedBadge()).toHaveTextContent("10 hours");
    });
  });

  describe("given entry without hours played", () => {
    it("should not display hours played badge", () => {
      const entry = createMockEntry({ playSession: null });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getHoursPlayedBadge()).not.toBeInTheDocument();
    });
  });

  describe("given entry with both mood and hours played", () => {
    it("should display both badges", () => {
      const entry = createMockEntry({
        mood: JournalMood.EXCITED,
        playSession: 5,
      });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getMoodBadge()).toBeVisible();
      expect(elements.getHoursPlayedBadge()).toBeVisible();
    });
  });

  describe("given entry with no optional fields", () => {
    it("should not display metadata section", () => {
      const entry = createMockEntry({
        mood: null,
        playSession: null,
      });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getMoodBadge()).not.toBeInTheDocument();
      expect(elements.getHoursPlayedBadge()).not.toBeInTheDocument();
    });
  });

  describe("given game with cover image", () => {
    it("should render game card with cover image", () => {
      const entry = createMockEntry();
      const game = createMockGame({ coverImage: "cover123" });

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getGameCard()).toBeVisible();
    });
  });

  describe("given game without cover image", () => {
    it("should render game card without cover image", () => {
      const entry = createMockEntry();
      const game = createMockGame({ coverImage: null });

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      expect(elements.getGameCard()).toBeVisible();
    });
  });

  describe("edit button navigation", () => {
    it("should link to correct edit route", () => {
      const entry = createMockEntry({ id: "entry-123" });
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      const editButton = elements.getEditButton();
      expect(editButton).toHaveAttribute("href", "/journal/entry-123/edit");
    });

    it("should be clickable link", () => {
      const entry = createMockEntry();
      const game = createMockGame();

      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);

      const editButton = elements.getEditButton();
      expect(editButton.tagName).toBe("A");
    });
  });

  describe("delete flow", () => {
    const entry = createMockEntry();
    const game = createMockGame();

    beforeEach(() => {
      renderWithTestProviders(<JournalEntryDetail entry={entry} game={game} />);
    });

    describe("given user clicks delete button", () => {
      it("should open delete confirmation dialog", async () => {
        await actions.clickDeleteButton();

        await waitFor(() => {
          expect(elements.getDeleteDialog()).toBeVisible();
        });

        expect(elements.getDeleteDialogTitle()).toBeVisible();
        expect(elements.getDeleteDialogDescription()).toBeVisible();
      });

      it("should display entry title in dialog description", async () => {
        await actions.clickDeleteButton();

        await waitFor(() => {
          expect(elements.getDeleteDialog()).toBeVisible();
        });

        expect(elements.getDeleteDialogDescription()).toHaveTextContent(
          "My First Entry"
        );
      });

      it("should display 'this entry' when entry has no title", async () => {
        const entryWithoutTitle = createMockEntry({ title: null });
        renderWithTestProviders(
          <JournalEntryDetail entry={entryWithoutTitle} game={game} />
        );

        await actions.clickDeleteButton();

        await waitFor(() => {
          expect(elements.getDeleteDialog()).toBeVisible();
        });

        expect(elements.getDeleteDialogDescription()).toHaveTextContent(
          "this entry"
        );
      });
    });

    describe("given delete dialog is open", () => {
      beforeEach(async () => {
        await actions.clickDeleteButton();
        await waitFor(() => {
          expect(elements.getDeleteDialog()).toBeVisible();
        });
      });

      it("should close dialog when cancel is clicked", async () => {
        await actions.clickDeleteCancel();

        await waitFor(() => {
          expect(elements.getDeleteDialog()).not.toBeVisible();
        });
      });

      it("should call deleteJournalEntryAction when confirm is clicked", async () => {
        mockDeleteJournalEntryAction.mockResolvedValue({
          success: true,
          data: undefined,
        });

        await actions.clickDeleteConfirm();

        await waitFor(() => {
          expect(mockDeleteJournalEntryAction).toHaveBeenCalledWith({
            entryId: "entry-1",
          });
        });
      });

      it("should show success toast and redirect on successful deletion", async () => {
        mockDeleteJournalEntryAction.mockResolvedValue({
          success: true,
          data: undefined,
        });

        await actions.clickDeleteConfirm();

        await waitFor(() => {
          expect(mockToastSuccess).toHaveBeenCalledWith(
            "Journal entry deleted",
            {
              description: "Your journal entry has been permanently deleted.",
            }
          );
        });

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith("/journal");
        });
      });

      it("should show error toast when deletion fails", async () => {
        mockDeleteJournalEntryAction.mockResolvedValue({
          success: false,
          error: "Failed to delete entry",
        });

        await actions.clickDeleteConfirm();

        await waitFor(() => {
          expect(mockToastError).toHaveBeenCalledWith(
            "Failed to delete entry",
            {
              description: "Failed to delete entry",
            }
          );
        });
      });

      it("should show error toast on unexpected error", async () => {
        mockDeleteJournalEntryAction.mockRejectedValue(
          new Error("Network error")
        );

        await actions.clickDeleteConfirm();

        await waitFor(() => {
          expect(mockToastError).toHaveBeenCalledWith(
            "An unexpected error occurred",
            {
              description: "Network error",
            }
          );
        });
      });

      it("should disable delete button while deleting", async () => {
        mockDeleteJournalEntryAction.mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ success: true, data: undefined }), 100)
            )
        );

        await actions.clickDeleteConfirm();

        const deleteButton = elements.getDeleteButton();
        expect(deleteButton).toBeDisabled();
        expect(deleteButton).toHaveTextContent("Deleting...");
      });
    });
  });
});
