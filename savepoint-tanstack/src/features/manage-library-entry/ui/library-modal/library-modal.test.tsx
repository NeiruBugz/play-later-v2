/**
 * RED component test for LibraryModal (Slice 11 — manage-library-entry).
 *
 * This file is intentionally failing at module resolution:
 * `./library-modal` does not exist yet — the component is implemented in
 * the GREEN step (tasks.md line 230). Do NOT implement the component here.
 *
 * The following API modules are also RED imports that will be created
 * in tasks.md line 229:
 *   ../../api/update-library-item-fn
 *   ../../api/delete-library-item-fn
 *
 * =========================================================================
 * Contracts locked by this test
 * =========================================================================
 *
 * Component export:
 *   `LibraryModal` — named export from `./library-modal`
 *
 * Props (locked):
 *   entry:        LibraryItemWithGame  — the item being edited
 *   open:         boolean              — controls Dialog open state
 *   onOpenChange: (open: boolean) => void — called when dialog requests close
 *
 * Field controls (locked accessible names):
 *   combobox "Status"    — current status of the library entry
 *   combobox "Platform"  — platform the game was played on
 *   spinbutton "Rating"  — integer rating 1–10 (nullable)
 *   textbox "Started"    — date the player started the game (startedAt)
 *   textbox "Completed"  — date the player completed the game (completedAt)
 *
 *   Rationale: "Status", "Platform", "Rating" match the canonical savepoint-app
 *   form labels. "Started" / "Completed" follow savepoint-app date-field labels
 *   ("Started at" / "Completed at" abbreviated to single word for brevity;
 *   GREEN agent must use these exact accessible names).
 *
 * Submit behavior:
 *   - Button label: "Save changes"  (matches profile-settings-form precedent)
 *   - Invokes updateLibraryItemFn({ data: { itemId, status, platform, rating,
 *       startedAt, completedAt } })
 *   - Exact data shape locked via mock.calls[0][0] assertion
 *
 * UnauthorizedError inline surface:
 *   - When updateLibraryItemFn rejects with UnauthorizedError, renders an
 *     element with role="alert" whose textContent contains the error message.
 *   - Toast wiring is a SEPARATE sub-task (tasks.md line 232). Do NOT assert
 *     toasts in this test file.
 *
 * Delete confirmation gate:
 *   - Trigger label: "Remove from library"
 *   - Clicking the trigger must NOT immediately invoke deleteLibraryItemFn.
 *   - A confirmation surface must appear containing:
 *       confirm button: "Confirm"
 *       cancel  button: "Cancel"
 *   - Only after clicking "Confirm" is deleteLibraryItemFn invoked.
 *   - The surface type (dialog vs inline) is left to GREEN; we only assert
 *     button presence and call sequencing.
 *   - Toast + close-on-success wiring belongs in tasks.md line 232.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/api";
import { UnauthorizedError } from "@/shared/lib/errors";

import { deleteLibraryItemFn } from "../../api/delete-library-item-fn";
// Import after mocks are declared.
import { updateLibraryItemFn } from "../../api/update-library-item-fn";
// RED import — this module does not exist until the GREEN step.
import { LibraryModal } from "./library-modal";

// --- Toast mock (mirrors add-game-modal precedent) --------------------------
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// --- Router mock (mirrors add-game-modal precedent) -------------------------
const mockRouterInvalidate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mockRouterInvalidate }),
}));

// --- Server fn mocks ---------------------------------------------------------
// updateLibraryItemFn and deleteLibraryItemFn are called as plain async fns
// with { data: ... } argument shape (TanStack Start createServerFn convention).
// The modules do not exist yet; the TS2307 error here IS the RED signal.

vi.mock("../../api/update-library-item-fn", () => ({
  updateLibraryItemFn: vi.fn(),
}));

vi.mock("../../api/delete-library-item-fn", () => ({
  deleteLibraryItemFn: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Minimal LibraryItemWithGame that satisfies the type without requiring
// real Prisma scalars for fields the modal doesn't display.
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
  game: {
    id: "game-xyz",
    igdbId: 1234,
    title: "Hollow Knight",
    slug: "hollow-knight",
    coverImage: null,
    releaseDate: null,
  },
};

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

const onOpenChange = vi.fn();

const defaultProps = {
  entry: STUB_ENTRY,
  open: true,
  onOpenChange,
};

// Element vocabulary — accessible names are locked by these queries.
// The GREEN agent MUST match these exact strings as accessible names.
const elements = {
  // Form fields
  getStatusCombobox: () => screen.getByRole("combobox", { name: "Status" }),
  getPlatformCombobox: () => screen.getByRole("combobox", { name: "Platform" }),
  getRatingInput: () => screen.getByRole("spinbutton", { name: "Rating" }),
  getStartedInput: () => screen.getByRole("textbox", { name: "Started" }),
  getCompletedInput: () => screen.getByRole("textbox", { name: "Completed" }),

  // Submit / close
  getSaveButton: () => screen.getByRole("button", { name: "Save changes" }),

  // Delete flow
  getDeleteTrigger: () =>
    screen.getByRole("button", { name: "Remove from library" }),
  queryDeleteTrigger: () =>
    screen.queryByRole("button", { name: "Remove from library" }),
  getConfirmButton: () => screen.getByRole("button", { name: "Confirm" }),
  getCancelButton: () => screen.getByRole("button", { name: "Cancel" }),
  queryConfirmButton: () => screen.queryByRole("button", { name: "Confirm" }),

  // Inline error surface
  getInlineAlert: () => screen.getByRole("alert"),
  queryInlineAlert: () => screen.queryByRole("alert"),
};

// Action vocabulary — domain-named, composing elements above.
const actions = {
  clickSave: () => userEvent.click(elements.getSaveButton()),
  clickDeleteTrigger: () => userEvent.click(elements.getDeleteTrigger()),
  clickConfirmDelete: () => userEvent.click(elements.getConfirmButton()),
  clickCancelDelete: () => userEvent.click(elements.getCancelButton()),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LibraryModal", () => {
  beforeEach(() => {
    vi.mocked(updateLibraryItemFn).mockReset();
    vi.mocked(deleteLibraryItemFn).mockReset();
    onOpenChange.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
    mockRouterInvalidate.mockReset();
    mockRouterInvalidate.mockResolvedValue(undefined);
  });

  // ---- Field presence (initial render) ----------------------------------------

  describe("given the modal is open with a populated entry", () => {
    beforeEach(() => {
      render(<LibraryModal {...defaultProps} />);
    });

    it("renders the Status combobox", () => {
      expect(elements.getStatusCombobox()).toBeDefined();
    });

    it("renders the Platform combobox", () => {
      expect(elements.getPlatformCombobox()).toBeDefined();
    });

    it("renders the Rating spinbutton", () => {
      expect(elements.getRatingInput()).toBeDefined();
    });

    it("renders the Started date input", () => {
      expect(elements.getStartedInput()).toBeDefined();
    });

    it("renders the Completed date input", () => {
      expect(elements.getCompletedInput()).toBeDefined();
    });

    it("renders the Save changes button", () => {
      expect(elements.getSaveButton()).toBeDefined();
    });

    it("renders the Remove from library trigger", () => {
      expect(elements.getDeleteTrigger()).toBeDefined();
    });

    it("does not show an inline alert before any submission", () => {
      expect(elements.queryInlineAlert()).toBeNull();
    });
  });

  // ---- Submit invokes updateLibraryItemFn -------------------------------------

  describe("given the user clicks Save changes", () => {
    beforeEach(async () => {
      vi.mocked(updateLibraryItemFn).mockResolvedValue(undefined as never);
      render(<LibraryModal {...defaultProps} />);
      await actions.clickSave();
    });

    it("calls updateLibraryItemFn exactly once", async () => {
      await waitFor(() => {
        expect(vi.mocked(updateLibraryItemFn)).toHaveBeenCalledOnce();
      });
    });

    it("passes itemId matching entry.id in the data payload", async () => {
      await waitFor(() => {
        expect(vi.mocked(updateLibraryItemFn)).toHaveBeenCalledOnce();
      });
      const arg = vi.mocked(updateLibraryItemFn).mock.calls[0]![0]! as {
        data: { itemId: number };
      };
      expect(arg.data.itemId).toBe(STUB_ENTRY.id);
    });

    it("wraps the payload in the { data: ... } envelope (TanStack Start convention)", async () => {
      await waitFor(() => {
        expect(vi.mocked(updateLibraryItemFn)).toHaveBeenCalledOnce();
      });
      const arg = vi.mocked(updateLibraryItemFn).mock.calls[0]![0]! as {
        data: { itemId: number };
      };
      // Top-level key must be "data"
      expect(arg).toHaveProperty("data");
      expect(arg.data).toHaveProperty("itemId");
    });

    it("does not call deleteLibraryItemFn on save", () => {
      expect(vi.mocked(deleteLibraryItemFn)).not.toHaveBeenCalled();
    });
  });

  // ---- UnauthorizedError surfaces inline --------------------------------------

  describe("given updateLibraryItemFn rejects with UnauthorizedError", () => {
    const AUTH_ERROR_MESSAGE = "You must be signed in to update your library";

    beforeEach(async () => {
      vi.mocked(updateLibraryItemFn).mockRejectedValue(
        new UnauthorizedError(AUTH_ERROR_MESSAGE)
      );
      render(<LibraryModal {...defaultProps} />);
      await actions.clickSave();
    });

    it("renders an element with role=alert", async () => {
      await waitFor(() => {
        expect(elements.queryInlineAlert()).not.toBeNull();
      });
    });

    it("the alert contains the UnauthorizedError message text", async () => {
      await waitFor(() => {
        expect(elements.queryInlineAlert()).not.toBeNull();
      });
      expect(elements.getInlineAlert().textContent).toContain(
        AUTH_ERROR_MESSAGE
      );
    });

    it("does not call deleteLibraryItemFn when update fails", () => {
      expect(vi.mocked(deleteLibraryItemFn)).not.toHaveBeenCalled();
    });
  });

  // ---- Delete confirmation gate -----------------------------------------------

  describe("given the user clicks Remove from library", () => {
    beforeEach(async () => {
      render(<LibraryModal {...defaultProps} />);
      await actions.clickDeleteTrigger();
    });

    it("does NOT immediately call deleteLibraryItemFn (gate must intercept)", () => {
      expect(vi.mocked(deleteLibraryItemFn)).not.toHaveBeenCalled();
    });

    it("shows a Confirm button after clicking the delete trigger", () => {
      expect(elements.getConfirmButton()).toBeDefined();
    });

    it("shows a Cancel button after clicking the delete trigger", () => {
      expect(elements.getCancelButton()).toBeDefined();
    });
  });

  describe("given the delete confirmation surface is visible and the user confirms", () => {
    beforeEach(async () => {
      vi.mocked(deleteLibraryItemFn).mockResolvedValue(undefined);
      render(<LibraryModal {...defaultProps} />);
      await actions.clickDeleteTrigger();
      await actions.clickConfirmDelete();
    });

    it("calls deleteLibraryItemFn exactly once after confirmation", async () => {
      await waitFor(() => {
        expect(vi.mocked(deleteLibraryItemFn)).toHaveBeenCalledOnce();
      });
    });
  });

  describe("given the delete confirmation surface is visible and the user cancels", () => {
    beforeEach(async () => {
      render(<LibraryModal {...defaultProps} />);
      await actions.clickDeleteTrigger();
      await actions.clickCancelDelete();
    });

    it("does not call deleteLibraryItemFn after cancelling", () => {
      expect(vi.mocked(deleteLibraryItemFn)).not.toHaveBeenCalled();
    });

    it("hides the Confirm button after cancellation", () => {
      expect(elements.queryConfirmButton()).toBeNull();
    });
  });

  // ---- Update success: toast + invalidate + close ----------------------------

  describe("given updateLibraryItemFn resolves successfully", () => {
    beforeEach(async () => {
      vi.mocked(updateLibraryItemFn).mockResolvedValue(undefined as never);
      render(<LibraryModal {...defaultProps} />);
      await actions.clickSave();
    });

    it("fires toast.success once with the locked update copy", async () => {
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

    it("does not fire toast.error on success", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
    });
  });

  // ---- Update error: toast.error + no close + no invalidate ------------------

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

    it("does not fire toast.success on update error", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(toast.success)).not.toHaveBeenCalled();
    });
  });

  // ---- Delete success: toast + invalidate + close ----------------------------

  describe("given deleteLibraryItemFn resolves successfully", () => {
    beforeEach(async () => {
      vi.mocked(deleteLibraryItemFn).mockResolvedValue(undefined);
      render(<LibraryModal {...defaultProps} />);
      await actions.clickDeleteTrigger();
      await actions.clickConfirmDelete();
    });

    it("fires toast.success once with the locked delete copy", async () => {
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

  // ---- Delete error: toast.error + no close + no invalidate ------------------

  describe("given deleteLibraryItemFn rejects", () => {
    const AUTH_ERROR_MESSAGE = "nope";

    beforeEach(async () => {
      vi.mocked(deleteLibraryItemFn).mockRejectedValue(
        new UnauthorizedError(AUTH_ERROR_MESSAGE)
      );
      render(<LibraryModal {...defaultProps} />);
      await actions.clickDeleteTrigger();
      await actions.clickConfirmDelete();
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

    it("does not call router.invalidate on delete error", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });
      expect(mockRouterInvalidate).not.toHaveBeenCalled();
    });
  });

  // ---- Confirmation gate idempotency -----------------------------------------

  describe("given the delete trigger is reopened after a cancel", () => {
    beforeEach(async () => {
      vi.mocked(deleteLibraryItemFn).mockResolvedValue(undefined);
      render(<LibraryModal {...defaultProps} />);
      await actions.clickDeleteTrigger();
      await actions.clickCancelDelete();
      // Reopen after Cancel
      await actions.clickDeleteTrigger();
      await actions.clickConfirmDelete();
    });

    it("calls deleteLibraryItemFn exactly once across the cancel+confirm cycle", async () => {
      await waitFor(() => {
        expect(vi.mocked(deleteLibraryItemFn)).toHaveBeenCalledOnce();
      });
    });
  });

  // ---- Closed modal renders nothing -------------------------------------------

  describe("given the modal is closed (open=false)", () => {
    beforeEach(() => {
      render(<LibraryModal {...defaultProps} open={false} />);
    });

    it("does not render the Save changes button when closed", () => {
      expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
    });

    it("does not render the Status combobox when closed", () => {
      expect(screen.queryByRole("combobox", { name: "Status" })).toBeNull();
    });
  });
});
