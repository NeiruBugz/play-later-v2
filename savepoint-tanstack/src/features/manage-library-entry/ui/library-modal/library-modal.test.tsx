/**
 * Component test for LibraryModal (manage-library-entry).
 *
 * The modal's contract:
 *   - Edits platform and rating only; status moves through `setStatusFn`
 *     and there are no started/completed date fields or "Mark complete".
 *   - Remove is a destructive footer button (not a one-item menu); the
 *     confirmation is the shared RemoveFromLibraryDialog (no typing).
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/api";
import { UnauthorizedError } from "@/shared/lib/errors";

import { buildLibraryItemWithGame } from "../../../../../test/factories/builders.ts";
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

const STUB_ENTRY: LibraryItemWithGame = buildLibraryItemWithGame(
  { id: 42, status: "PLAYING", platform: "PC", rating: 8 },
  { id: "game-xyz", title: "Hollow Knight", slug: "hollow-knight" }
);

const onOpenChange = vi.fn();

const defaultProps = {
  entry: STUB_ENTRY,
  open: true,
  onOpenChange,
};

const elements = {
  getPlatformCombobox: () => screen.getByRole("button", { name: "Platform" }),
  getRatingInput: () => screen.getByRole("slider", { name: "Rating" }),
  getSaveButton: () => screen.getByRole("button", { name: "Save changes" }),
  queryStatusCombobox: () => screen.queryByRole("combobox", { name: "Status" }),
  queryStartedTrigger: () => screen.queryByRole("button", { name: "Started" }),
  queryCompletedTrigger: () =>
    screen.queryByRole("button", { name: "Completed" }),
  queryMarkCompleteButton: () =>
    screen.queryByRole("button", { name: "Mark complete" }),
  getDeleteFromLibraryButton: () =>
    screen.getByRole("button", { name: "Remove from library" }),
  queryConfirmTitle: () =>
    screen.queryByText("Remove Hollow Knight from your library?"),
  queryTextbox: () => screen.queryByRole("textbox"),
  getDeleteButton: () => screen.getByRole("button", { name: "Remove" }),
  getCancelButton: () => screen.getByRole("button", { name: "Cancel" }),

  getInlineAlert: () => screen.getByRole("alert"),
  queryInlineAlert: () => screen.queryByRole("alert"),
};

const actions = {
  clickSave: () => userEvent.click(elements.getSaveButton()),
  openPlatformSelect: () => userEvent.click(elements.getPlatformCombobox()),
  openDeleteConfirm: async () => {
    await userEvent.click(elements.getDeleteFromLibraryButton());
  },
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
      expect(elements.getPlatformCombobox()).toBeDefined();
      expect(elements.getRatingInput()).toBeDefined();
      expect(elements.getSaveButton()).toBeDefined();
    });

    it("no longer offers a status select, play dates or Mark complete", () => {
      expect(elements.queryStatusCombobox()).toBeNull();
      expect(elements.queryStartedTrigger()).toBeNull();
      expect(elements.queryCompletedTrigger()).toBeNull();
      expect(elements.queryMarkCompleteButton()).toBeNull();
    });

    it("exposes remove as a footer button, with the confirmation hidden until invoked", () => {
      expect(elements.getDeleteFromLibraryButton()).toBeDefined();
      expect(elements.queryConfirmTitle()).toBeNull();
    });

    it("does not show an inline alert before any submission", () => {
      expect(elements.queryInlineAlert()).toBeNull();
    });
  });

  describe("given the user clicks Save changes", () => {
    beforeEach(async () => {
      vi.mocked(updateLibraryItemFn).mockResolvedValue(undefined as never);
      render(<LibraryModal {...defaultProps} />);
      await actions.clickSave();
    });

    it("sends only the entry id, platform and rating to updateLibraryItemFn", async () => {
      await waitFor(() => {
        expect(vi.mocked(updateLibraryItemFn)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(updateLibraryItemFn)).toHaveBeenCalledWith({
        data: { itemId: STUB_ENTRY.id, platform: "PC", rating: 8 },
      });
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

    it("asks for confirmation in the agreed words with Remove and Cancel", () => {
      expect(elements.queryConfirmTitle()).not.toBeNull();
      expect(
        screen.getByText(
          "Its play history and rating will be deleted. Your notes stay in your Journal."
        )
      ).toBeDefined();
      expect(elements.getDeleteButton()).toBeDefined();
      expect(elements.getCancelButton()).toBeDefined();
    });

    it("does not ask the user to type the title", () => {
      expect(elements.queryTextbox()).toBeNull();
      expect(elements.getDeleteButton()).toBeEnabled();
    });
  });

  describe("given the user confirms removal", () => {
    beforeEach(async () => {
      vi.mocked(deleteLibraryItemFn).mockResolvedValue(undefined);
      render(<LibraryModal {...defaultProps} />);
      await actions.openDeleteConfirm();
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

    it("closes the confirmation", () => {
      expect(elements.queryConfirmTitle()).toBeNull();
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
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Game updated");
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
});
