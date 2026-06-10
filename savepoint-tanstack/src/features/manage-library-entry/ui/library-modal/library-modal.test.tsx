/**
 * Component test for LibraryModal (manage-library-entry).
 *
 * The modal's contract:
 *   - Started / Completed are DatePicker triggers (buttons queried by their
 *     accessible name "Started" / "Completed"), not native date inputs.
 *   - A "Mark complete" one-tap sets Completed to a non-null Date when empty.
 *   - Delete is a destructive footer button (not a one-item ⋯ menu); the
 *     confirmation is a typed-name gate (type the title to arm "Delete").
 *   - Marking Completed derives PLAYED in the Status select.
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/api";
import { UnauthorizedError } from "@/shared/lib/errors";

import { deleteLibraryItemFn } from "../../api/delete-library-item-fn";
import { getPlatformOptionsFn } from "../../api/get-platform-options";
import { updateLibraryItemFn } from "../../api/update-library-item-fn";
import { LibraryModal } from "./library-modal";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockRouterInvalidate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mockRouterInvalidate }),
}));

vi.mock("../../api/update-library-item-fn", () => ({
  updateLibraryItemFn: vi.fn(),
}));

vi.mock("../../api/delete-library-item-fn", () => ({
  deleteLibraryItemFn: vi.fn(),
}));

vi.mock("../../api/get-platform-options", () => ({
  getPlatformOptionsFn: vi.fn(),
}));

vi.mock("../../api/search-platforms-fn", () => ({
  searchPlatformsFn: vi.fn(() => Promise.resolve([])),
}));

const PLATFORM_OPTIONS_RESULT = [
  { label: "This game", platforms: ["PC", "Switch"] },
  { label: "Your platforms", platforms: ["Steam Deck"] },
];

const STUB_ENTRY: LibraryItemWithGame = {
  id: 42,
  userId: "user-abc",
  gameId: "game-xyz",
  status: "PLAYING",
  platform: "PC",
  rating: 8,
  startedAt: new Date("2024-01-15"),
  completedAt: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
  statusChangedAt: null,
  acquisitionType: "DIGITAL",
  hasBeenPlayed: true,
  statusIsManual: false,
  game: {
    id: "game-xyz",
    igdbId: 1234,
    title: "Hollow Knight",
    slug: "hollow-knight",
    coverImage: null,
    releaseDate: null,
  },
};

const onOpenChange = vi.fn();

const defaultProps = {
  entry: STUB_ENTRY,
  open: true,
  onOpenChange,
};

const elements = {
  getStatusCombobox: () => screen.getByRole("combobox", { name: "Status" }),
  getPlatformCombobox: () => screen.getByRole("button", { name: "Platform" }),
  getRatingInput: () => screen.getByRole("slider", { name: "Rating" }),
  getStartedTrigger: () => screen.getByRole("button", { name: "Started" }),
  getCompletedTrigger: () => screen.getByRole("button", { name: "Completed" }),
  // Each calendar day is a button inside its gridcell; the gridcell's accessible
  // name is its day-of-month text, unambiguous for mid-month days.
  getCalendarDayButton: (dayOfMonth: string) =>
    within(screen.getByRole("gridcell", { name: dayOfMonth })).getByRole(
      "button"
    ),
  getSaveButton: () => screen.getByRole("button", { name: "Save changes" }),
  getMarkCompleteButton: () =>
    screen.getByRole("button", { name: "Mark complete" }),
  queryMarkCompleteButton: () =>
    screen.queryByRole("button", { name: "Mark complete" }),

  getDeleteFromLibraryButton: () =>
    screen.getByRole("button", { name: "Delete from library" }),
  getDeleteConfirmInput: () =>
    screen.getByLabelText("Type the game title to confirm deletion"),
  queryDeleteConfirmInput: () =>
    screen.queryByLabelText("Type the game title to confirm deletion"),
  getDeleteButton: () => screen.getByRole("button", { name: "Delete" }),
  getCancelButton: () => screen.getByRole("button", { name: "Cancel" }),

  getInlineAlert: () => screen.getByRole("alert"),
  queryInlineAlert: () => screen.queryByRole("alert"),
};

const actions = {
  clickSave: () => userEvent.click(elements.getSaveButton()),
  clickMarkComplete: () => userEvent.click(elements.getMarkCompleteButton()),
  openPlatformSelect: () => userEvent.click(elements.getPlatformCombobox()),
  pickStartedDay: async (dayOfMonth: string) => {
    await userEvent.click(elements.getStartedTrigger());
    await userEvent.click(elements.getCalendarDayButton(dayOfMonth));
  },
  openDeleteConfirm: async () => {
    await userEvent.click(elements.getDeleteFromLibraryButton());
  },
  typeDeleteConfirmation: (title: string) =>
    userEvent.type(elements.getDeleteConfirmInput(), title),
  clickDelete: () => userEvent.click(elements.getDeleteButton()),
  clickCancel: () => userEvent.click(elements.getCancelButton()),
};

describe("LibraryModal", () => {
  beforeEach(() => {
    vi.mocked(updateLibraryItemFn).mockReset();
    vi.mocked(deleteLibraryItemFn).mockReset();
    vi.mocked(getPlatformOptionsFn).mockReset();
    vi.mocked(getPlatformOptionsFn).mockResolvedValue(PLATFORM_OPTIONS_RESULT);
    onOpenChange.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
    mockRouterInvalidate.mockReset();
    mockRouterInvalidate.mockResolvedValue(undefined);
  });

  describe("given the modal is open with a populated entry", () => {
    beforeEach(() => {
      render(<LibraryModal {...defaultProps} />);
    });

    it("renders all editable form fields and controls", () => {
      expect(elements.getStatusCombobox()).toBeDefined();
      expect(elements.getPlatformCombobox()).toBeDefined();
      expect(elements.getRatingInput()).toBeDefined();
      expect(elements.getStartedTrigger()).toBeDefined();
      expect(elements.getCompletedTrigger()).toBeDefined();
      expect(elements.getSaveButton()).toBeDefined();
    });

    it("exposes delete as a footer button, with the confirm gate hidden until invoked", () => {
      expect(elements.getDeleteFromLibraryButton()).toBeDefined();
      expect(elements.queryDeleteConfirmInput()).toBeNull();
    });

    it("renders datepicker triggers for Started and Completed", () => {
      expect(elements.getStartedTrigger()).toBeDefined();
      expect(elements.getCompletedTrigger()).toBeDefined();
    });

    it("does not show an inline alert before any submission", () => {
      expect(elements.queryInlineAlert()).toBeNull();
    });
  });

  describe("given the entry has no completed date", () => {
    beforeEach(() => {
      render(
        <LibraryModal
          {...defaultProps}
          entry={{ ...STUB_ENTRY, completedAt: null }}
        />
      );
    });

    it("offers a Mark complete shortcut", () => {
      expect(elements.getMarkCompleteButton()).toBeDefined();
    });

    it("fills the completed date and submits a non-null completedAt after marking", async () => {
      vi.mocked(updateLibraryItemFn).mockResolvedValue(undefined as never);
      await actions.clickMarkComplete();
      await actions.clickSave();
      await waitFor(() => {
        expect(vi.mocked(updateLibraryItemFn)).toHaveBeenCalledOnce();
      });
      const arg = vi.mocked(updateLibraryItemFn).mock.calls[0]?.[0] as {
        data: { completedAt: unknown };
      };
      expect(arg.data.completedAt).not.toBeNull();
    });
  });

  describe("given the entry already has a completed date", () => {
    beforeEach(() => {
      render(
        <LibraryModal
          {...defaultProps}
          entry={{ ...STUB_ENTRY, completedAt: new Date("2024-03-01") }}
        />
      );
    });

    it("hides the Mark complete shortcut", () => {
      expect(elements.queryMarkCompleteButton()).toBeNull();
    });
  });

  describe("given a non-PLAYED item and the user marks it complete", () => {
    beforeEach(async () => {
      render(
        <LibraryModal
          {...defaultProps}
          entry={{ ...STUB_ENTRY, status: "PLAYING", completedAt: null }}
        />
      );
      await actions.clickMarkComplete();
    });

    it("moves the status to Played", () => {
      expect(elements.getStatusCombobox().textContent).toContain("Played");
    });
  });

  describe("given the user clicks Save changes", () => {
    beforeEach(async () => {
      vi.mocked(updateLibraryItemFn).mockResolvedValue(undefined as never);
      render(<LibraryModal {...defaultProps} />);
      await actions.clickSave();
    });

    it("calls updateLibraryItemFn with the entry id in the { data } envelope", async () => {
      await waitFor(() => {
        expect(vi.mocked(updateLibraryItemFn)).toHaveBeenCalledOnce();
      });
      const arg = vi.mocked(updateLibraryItemFn).mock.calls[0]![0]! as {
        data: { itemId: number };
      };
      expect(arg.data.itemId).toBe(STUB_ENTRY.id);
    });

    it("does not call deleteLibraryItemFn on save", () => {
      expect(vi.mocked(deleteLibraryItemFn)).not.toHaveBeenCalled();
    });
  });

  describe("given updateLibraryItemFn rejects with UnauthorizedError", () => {
    const AUTH_ERROR_MESSAGE = "You must be signed in to update your library";

    beforeEach(async () => {
      vi.mocked(updateLibraryItemFn).mockRejectedValue(
        new UnauthorizedError(AUTH_ERROR_MESSAGE)
      );
      render(<LibraryModal {...defaultProps} />);
      await actions.clickSave();
    });

    it("renders an inline alert containing the UnauthorizedError message", async () => {
      await waitFor(() => {
        expect(elements.queryInlineAlert()).not.toBeNull();
      });
      expect(elements.getInlineAlert().textContent).toContain(
        AUTH_ERROR_MESSAGE
      );
    });
  });

  describe("given the user opens Delete from the footer button", () => {
    beforeEach(async () => {
      render(<LibraryModal {...defaultProps} />);
      await actions.openDeleteConfirm();
    });

    it("does NOT immediately call deleteLibraryItemFn (gate must intercept)", () => {
      expect(vi.mocked(deleteLibraryItemFn)).not.toHaveBeenCalled();
    });

    it("shows the typed-name confirmation surface", () => {
      expect(elements.getDeleteConfirmInput()).toBeDefined();
      expect(elements.getDeleteButton()).toBeDefined();
      expect(elements.getCancelButton()).toBeDefined();
    });

    it("keeps the Delete button disabled until the title is typed exactly", () => {
      expect(elements.getDeleteButton()).toBeDisabled();
    });
  });

  describe("given the user types the title and confirms deletion", () => {
    beforeEach(async () => {
      vi.mocked(deleteLibraryItemFn).mockResolvedValue(undefined);
      render(<LibraryModal {...defaultProps} />);
      await actions.openDeleteConfirm();
      await actions.typeDeleteConfirmation("Hollow Knight");
      await actions.clickDelete();
    });

    it("calls deleteLibraryItemFn exactly once after confirmation", async () => {
      await waitFor(() => {
        expect(vi.mocked(deleteLibraryItemFn)).toHaveBeenCalledOnce();
      });
    });
  });

  describe("given the user cancels the delete confirmation", () => {
    beforeEach(async () => {
      render(<LibraryModal {...defaultProps} />);
      await actions.openDeleteConfirm();
      await actions.clickCancel();
    });

    it("does not call deleteLibraryItemFn after cancelling", () => {
      expect(vi.mocked(deleteLibraryItemFn)).not.toHaveBeenCalled();
    });

    it("hides the typed-name confirmation surface", () => {
      expect(elements.queryDeleteConfirmInput()).toBeNull();
    });
  });

  describe("given updateLibraryItemFn resolves successfully", () => {
    beforeEach(async () => {
      vi.mocked(updateLibraryItemFn).mockResolvedValue(undefined as never);
      render(<LibraryModal {...defaultProps} />);
      await actions.clickSave();
    });

    it("fires toast.success with the locked update copy", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
          "Library entry updated"
        );
      });
      expect(vi.mocked(toast.success)).toHaveBeenCalledOnce();
    });

    it("calls router.invalidate exactly once", async () => {
      await waitFor(() => {
        expect(mockRouterInvalidate).toHaveBeenCalledOnce();
      });
    });

    it("calls onOpenChange(false) once to close the modal", async () => {
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
      expect(onOpenChange).toHaveBeenCalledOnce();
    });
  });

  describe("given updateLibraryItemFn rejects (toast/lifecycle)", () => {
    const AUTH_ERROR_MESSAGE = "nope";

    beforeEach(async () => {
      vi.mocked(updateLibraryItemFn).mockRejectedValue(
        new UnauthorizedError(AUTH_ERROR_MESSAGE)
      );
      render(<LibraryModal {...defaultProps} />);
      await actions.clickSave();
    });

    it("fires toast.error once with the rejection message", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith(AUTH_ERROR_MESSAGE);
      });
      expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
    });

    it("does not call onOpenChange on update error (modal stays open)", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("does not call router.invalidate on update error", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });
      expect(mockRouterInvalidate).not.toHaveBeenCalled();
    });
  });

  describe("given deleteLibraryItemFn resolves successfully", () => {
    beforeEach(async () => {
      vi.mocked(deleteLibraryItemFn).mockResolvedValue(undefined);
      render(<LibraryModal {...defaultProps} />);
      await actions.openDeleteConfirm();
      await actions.typeDeleteConfirmation("Hollow Knight");
      await actions.clickDelete();
    });

    it("fires toast.success with the locked delete copy", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
          "Removed from library"
        );
      });
      expect(vi.mocked(toast.success)).toHaveBeenCalledOnce();
    });

    it("calls router.invalidate exactly once after delete", async () => {
      await waitFor(() => {
        expect(mockRouterInvalidate).toHaveBeenCalledOnce();
      });
    });

    it("calls onOpenChange(false) once to close the modal after delete", async () => {
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
      expect(onOpenChange).toHaveBeenCalledOnce();
    });
  });

  describe("given deleteLibraryItemFn rejects", () => {
    const AUTH_ERROR_MESSAGE = "nope";

    beforeEach(async () => {
      vi.mocked(deleteLibraryItemFn).mockRejectedValue(
        new UnauthorizedError(AUTH_ERROR_MESSAGE)
      );
      render(<LibraryModal {...defaultProps} />);
      await actions.openDeleteConfirm();
      await actions.typeDeleteConfirmation("Hollow Knight");
      await actions.clickDelete();
    });

    it("fires toast.error once with the rejection message", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith(AUTH_ERROR_MESSAGE);
      });
      expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
    });

    it("does not call onOpenChange on delete error (modal stays open)", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe("given the modal is closed (open=false)", () => {
    beforeEach(() => {
      render(<LibraryModal {...defaultProps} open={false} />);
    });

    it("does not render the form", () => {
      expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
      expect(screen.queryByRole("combobox", { name: "Status" })).toBeNull();
    });
  });

  describe("given the entry has a custom platform not in the standard list", () => {
    beforeEach(() => {
      render(
        <LibraryModal
          {...defaultProps}
          entry={{ ...STUB_ENTRY, platform: "Atari Jaguar" }}
        />
      );
    });

    it("renders the custom platform option in the platform selector", async () => {
      expect(
        (await screen.findAllByText("Atari Jaguar")).length
      ).toBeGreaterThan(0);
    });
  });

  describe("given the platform options resolve from the server", () => {
    beforeEach(() => {
      render(<LibraryModal {...defaultProps} />);
    });

    it("requests platform options for the entry's game id", async () => {
      await waitFor(() => {
        expect(vi.mocked(getPlatformOptionsFn)).toHaveBeenCalledWith({
          data: { gameId: STUB_ENTRY.game.id },
        });
      });
    });

    it("renders a returned platform option in the platform selector", async () => {
      await waitFor(() =>
        expect(vi.mocked(getPlatformOptionsFn)).toHaveBeenCalled()
      );
      await actions.openPlatformSelect();
      expect((await screen.findAllByText("Switch")).length).toBeGreaterThan(0);
    });
  });

  describe("given the platform select is opened", () => {
    beforeEach(async () => {
      render(<LibraryModal {...defaultProps} />);
      await waitFor(() =>
        expect(vi.mocked(getPlatformOptionsFn)).toHaveBeenCalled()
      );
      await actions.openPlatformSelect();
    });

    it("separates the game's platforms from the user's under section headings", async () => {
      expect(await screen.findByText("This game")).toBeInTheDocument();
      expect(screen.getByText("Your platforms")).toBeInTheDocument();
    });
  });

  describe("given the user sets a start date", () => {
    beforeEach(async () => {
      vi.mocked(updateLibraryItemFn).mockResolvedValue(undefined as never);
      render(
        <LibraryModal
          {...defaultProps}
          entry={{ ...STUB_ENTRY, startedAt: null }}
        />
      );
      await actions.pickStartedDay("15");
      await actions.clickSave();
    });

    it("submits a non-null startedAt value to updateLibraryItemFn", async () => {
      await waitFor(() => {
        expect(vi.mocked(updateLibraryItemFn)).toHaveBeenCalledOnce();
      });
      const arg = vi.mocked(updateLibraryItemFn).mock.calls[0]?.[0] as {
        data: { startedAt: unknown };
      };
      expect(arg.data.startedAt).not.toBeNull();
    });
  });

  describe("given the user sets a completed date", () => {
    beforeEach(async () => {
      vi.mocked(updateLibraryItemFn).mockResolvedValue(undefined as never);
      render(
        <LibraryModal
          {...defaultProps}
          entry={{ ...STUB_ENTRY, completedAt: null }}
        />
      );
      await actions.clickMarkComplete();
      await actions.clickSave();
    });

    it("submits a non-null completedAt value to updateLibraryItemFn", async () => {
      await waitFor(() => {
        expect(vi.mocked(updateLibraryItemFn)).toHaveBeenCalledOnce();
      });
      const arg = vi.mocked(updateLibraryItemFn).mock.calls[0]?.[0] as {
        data: { completedAt: unknown };
      };
      expect(arg.data.completedAt).not.toBeNull();
    });
  });
});
