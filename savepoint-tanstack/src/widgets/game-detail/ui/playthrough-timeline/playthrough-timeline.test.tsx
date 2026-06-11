/**
 * Component tests for PlaythroughTimeline / PlaythroughNode — delete behaviour
 * (Slice 4 / spec 016).
 *
 * Covers:
 * - A per-run Delete button is present for each run node.
 * - Clicking Delete opens a confirmation dialog that warns the user
 *   that journal entries will be detached (not deleted) from the run.
 * - The confirm dialog has a "Delete run" confirm button and a "Cancel" button.
 * - Confirming calls deletePlaythroughFn with the run id.
 * - Cancelling does NOT call deletePlaythroughFn.
 *
 * ============================================================
 * UI contract (impl MUST match these exact strings / roles)
 * ============================================================
 *
 * Delete affordance per run node:
 *   Button accessible name: "Delete run"
 *
 * Confirmation dialog:
 *   Role: "alertdialog"  (or "dialog")
 *   Warning text (visible in dialog body):
 *     "Your journal entries will stay but will be detached from this run."
 *   Confirm button accessible name: "Delete run"
 *   Cancel button accessible name:  "Keep run"
 *
 * ============================================================
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlaythroughWithEntries } from "@/entities/playthrough";
import { deletePlaythroughFn } from "@/features/manage-playthrough/api/delete-playthrough-fn";

import { PlaythroughTimeline } from "./playthrough-timeline";

vi.mock("@/features/manage-playthrough/api/delete-playthrough-fn", () => ({
  deletePlaythroughFn: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makePlaythrough(
  overrides: Partial<PlaythroughWithEntries> & { id: string }
): PlaythroughWithEntries {
  return {
    id: overrides.id,
    ordinal: overrides.ordinal ?? 1,
    kind: overrides.kind ?? "FIRST",
    status: overrides.status ?? "FINISHED",
    platform: overrides.platform ?? null,
    startedAt: overrides.startedAt ?? null,
    finishedAt: overrides.finishedAt ?? null,
    playtimeMinutes: overrides.playtimeMinutes ?? 0,
    rating: overrides.rating ?? null,
    completion: overrides.completion ?? null,
    notes: overrides.notes ?? null,
    journalEntries: overrides.journalEntries ?? [],
    libraryItemId: 1,
    libraryItem: undefined as never,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };
}

const RUN_ID = "run-del-confirm-001";

const defaultProps = {
  playthroughs: [makePlaythrough({ id: RUN_ID, status: "FINISHED" })],
  framing: "journey" as const,
  onAddPlaythrough: vi.fn(),
  onEditPlaythrough: vi.fn(),
  onLogSession: vi.fn(),
};

// ---------------------------------------------------------------------------
// Element & action vocabulary
// ---------------------------------------------------------------------------

const elements = {
  getDeleteRunButton: () => screen.getByRole("button", { name: "Delete run" }),
  queryConfirmDialog: () =>
    screen.queryByRole("alertdialog") ?? screen.queryByRole("dialog"),
  getConfirmDialog: () =>
    screen.getByRole("alertdialog", { hidden: false }) ??
    screen.getByRole("dialog"),
  getDetachWarning: () =>
    screen.getByText(
      "Your journal entries will stay but will be detached from this run."
    ),
  getConfirmDeleteButton: () =>
    screen.getByRole("button", { name: "Delete run" }),
  getCancelButton: () => screen.getByRole("button", { name: "Keep run" }),
};

const actions = {
  clickDeleteRun: () => userEvent.click(elements.getDeleteRunButton()),
  confirmDelete: () => userEvent.click(elements.getConfirmDeleteButton()),
  cancelDelete: () => userEvent.click(elements.getCancelButton()),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PlaythroughTimeline — PlaythroughNode delete behaviour", () => {
  beforeEach(() => {
    vi.mocked(deletePlaythroughFn).mockReset();
    vi.mocked(deletePlaythroughFn).mockResolvedValue(undefined as never);
  });

  describe("given a timeline with one run", () => {
    beforeEach(() => {
      render(<PlaythroughTimeline {...defaultProps} />);
    });

    it("renders a Delete run button for the run", () => {
      expect(elements.getDeleteRunButton()).not.toBeNull();
    });
  });

  describe("given the user clicks Delete run", () => {
    beforeEach(async () => {
      render(<PlaythroughTimeline {...defaultProps} />);
      await actions.clickDeleteRun();
    });

    it("opens a confirmation dialog", () => {
      expect(elements.queryConfirmDialog()).not.toBeNull();
    });

    it("shows the journal-entries detach warning in the dialog", () => {
      expect(elements.getDetachWarning()).not.toBeNull();
    });

    it("shows a 'Delete run' confirm button in the dialog", () => {
      expect(elements.getConfirmDeleteButton()).not.toBeNull();
    });

    it("shows a 'Keep run' cancel button in the dialog", () => {
      expect(elements.getCancelButton()).not.toBeNull();
    });
  });

  describe("given the user confirms deletion", () => {
    beforeEach(async () => {
      render(<PlaythroughTimeline {...defaultProps} />);
      await actions.clickDeleteRun();
      await actions.confirmDelete();
    });

    it("calls deletePlaythroughFn with the run id", async () => {
      await waitFor(() => {
        expect(vi.mocked(deletePlaythroughFn)).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ id: RUN_ID }),
          })
        );
      });
    });
  });

  describe("given the user cancels deletion", () => {
    beforeEach(async () => {
      render(<PlaythroughTimeline {...defaultProps} />);
      await actions.clickDeleteRun();
      await actions.cancelDelete();
    });

    it("does not call deletePlaythroughFn", () => {
      expect(vi.mocked(deletePlaythroughFn)).not.toHaveBeenCalled();
    });

    it("closes the confirmation dialog", async () => {
      await waitFor(() => {
        expect(elements.queryConfirmDialog()).toBeNull();
      });
    });
  });
});
