/**
 * Component tests for AddEditPlaythroughDrawer — edit mode (Slice 4 / spec 016).
 *
 * Covers:
 * - Drawer title is "Edit playthrough" in mode="edit".
 * - Fields are pre-filled from the playthrough prop.
 * - Submitting calls updatePlaythroughFn (not createPlaythroughFn) with
 *   the run id and the edited values.
 *
 * Testability hooks the impl MUST expose (edit mode):
 *   - Drawer title: accessible name "Edit playthrough" (SheetTitle text).
 *   - Submit button: accessible name "Save changes".
 *   - updatePlaythroughFn accepted as a mock import from
 *     "@/features/manage-playthrough/api/update-playthrough-fn".
 *     The fn receives { data: { id: <runId>, ...patchFields } }.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlaythroughFn } from "@/features/manage-playthrough/api/create-playthrough-fn";
import { updatePlaythroughFn } from "@/features/manage-playthrough/api/update-playthrough-fn";

import { AddEditPlaythroughDrawer } from "./add-edit-playthrough-drawer";

vi.mock("@/features/manage-playthrough/api/create-playthrough-fn", () => ({
  createPlaythroughFn: vi.fn(),
}));

vi.mock("@/features/manage-playthrough/api/update-playthrough-fn", () => ({
  updatePlaythroughFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const elements = {
  getTitle: () => screen.getByRole("heading", { name: "Edit playthrough" }),
  queryAddTitle: () =>
    screen.queryByRole("heading", { name: "New playthrough" }),
  getSubmitButton: () => screen.getByRole("button", { name: "Save changes" }),
  getNotesInput: () => screen.getByLabelText("Notes"),
  getHoursInput: () => screen.getByLabelText("Hours"),
  getStatusControl: () => screen.getByRole("combobox", { name: "Status" }),
};

const actions = {
  clearAndTypeNotes: async (value: string) => {
    const input = elements.getNotesInput();
    await userEvent.clear(input);
    await userEvent.type(input, value);
  },
  setStatus: async (label: string) => {
    await userEvent.click(elements.getStatusControl());
    await userEvent.click(screen.getByRole("option", { name: label }));
  },
  submit: () => userEvent.click(elements.getSubmitButton()),
};

const EXISTING_RUN_ID = "run-edit-test-001";

const prefillValues = {
  libraryItemId: 42,
  kind: "FIRST" as const,
  platform: "PC",
  status: "FINISHED" as const,
  startedAt: null,
  finishedAt: null,
  playtimeHours: 5,
  rating: null,
  completion: "Story",
  notes: "Original notes",
};

const prefillWithFinishedAt = {
  ...prefillValues,
  finishedAt: new Date("2024-03-01"),
};

const editModeProps = {
  open: true,
  mode: "edit" as const,
  libraryItemId: 42,
  existingPlaythroughCount: 1,
  playthroughId: EXISTING_RUN_ID,
  playthrough: prefillValues,
  onOpenChange: vi.fn(),
};

describe("AddEditPlaythroughDrawer — edit mode", () => {
  beforeEach(() => {
    vi.mocked(createPlaythroughFn).mockReset();
    vi.mocked(createPlaythroughFn).mockResolvedValue(undefined as never);
    vi.mocked(updatePlaythroughFn).mockReset();
    vi.mocked(updatePlaythroughFn).mockResolvedValue(undefined as never);
  });

  describe("given the drawer is open in edit mode with a prefilled playthrough", () => {
    beforeEach(() => {
      render(<AddEditPlaythroughDrawer {...editModeProps} />);
    });

    it("renders the title as 'Edit playthrough'", () => {
      expect(elements.getTitle()).not.toBeNull();
    });

    it("does not render the 'New playthrough' title", () => {
      expect(elements.queryAddTitle()).toBeNull();
    });

    it("renders the 'Save changes' submit button", () => {
      expect(elements.getSubmitButton()).not.toBeNull();
    });

    it("pre-fills the Notes input with the existing value", () => {
      const input = elements.getNotesInput() as HTMLTextAreaElement;
      expect(input.value).toBe("Original notes");
    });

    it("pre-fills the Hours input with the existing value", () => {
      const input = elements.getHoursInput() as HTMLInputElement;
      expect(input.value).toBe("5");
    });
  });

  describe("given the user edits notes and submits in edit mode", () => {
    beforeEach(async () => {
      render(<AddEditPlaythroughDrawer {...editModeProps} />);
      await actions.clearAndTypeNotes("Edited notes");
      await actions.submit();
    });

    it("calls updatePlaythroughFn (not createPlaythroughFn)", async () => {
      await waitFor(() => {
        expect(vi.mocked(updatePlaythroughFn)).toHaveBeenCalled();
      });
      expect(vi.mocked(createPlaythroughFn)).not.toHaveBeenCalled();
    });

    it("calls updatePlaythroughFn with the run id", async () => {
      await waitFor(() => {
        expect(vi.mocked(updatePlaythroughFn)).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              id: EXISTING_RUN_ID,
            }),
          })
        );
      });
    });

    it("calls updatePlaythroughFn with the edited notes value", async () => {
      await waitFor(() => {
        expect(vi.mocked(updatePlaythroughFn)).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              notes: "Edited notes",
            }),
          })
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // Bug #3 — editing a FINISHED run to "Playing" must clear finishedAt so the
  // schema refine !(status==="PLAYING" && finishedAt != null) doesn't block Save
  // -------------------------------------------------------------------------

  describe("given a FINISHED run with finishedAt set, when status is changed to Playing and submitted", () => {
    beforeEach(async () => {
      render(
        <AddEditPlaythroughDrawer
          open={true}
          mode="edit"
          libraryItemId={42}
          existingPlaythroughCount={1}
          playthroughId={EXISTING_RUN_ID}
          playthrough={prefillWithFinishedAt}
          onOpenChange={vi.fn()}
        />
      );
      await actions.setStatus("Playing");
      await actions.submit();
    });

    it("calls updatePlaythroughFn with finishedAt null (not the prefilled date)", async () => {
      await waitFor(() => {
        expect(vi.mocked(updatePlaythroughFn)).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              id: EXISTING_RUN_ID,
              status: "PLAYING",
              finishedAt: null,
            }),
          })
        );
      });
    });
  });
});
