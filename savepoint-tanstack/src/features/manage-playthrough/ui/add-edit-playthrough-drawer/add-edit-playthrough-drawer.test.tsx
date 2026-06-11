/**
 * Component tests for AddEditPlaythroughDrawer (Slice 3 / spec 016).
 *
 * Tests verify user-observable behaviour — not internal call-shape details.
 *
 * Testability hooks the impl MUST expose:
 *
 * Form fields (accessible by role / label):
 *   - Type (run kind):      combobox or group labelled "Type"
 *     Options: "First playthrough", "Replay"
 *   - Platform:             combobox labelled "Platform"
 *   - Status:               combobox or group labelled "Status"
 *     Options: "Playing", "Finished", "Abandoned"
 *   - Started:              textbox or date-input labelled "Started"
 *   - Finished:             textbox or date-input labelled "Finished"
 *     → must be disabled (aria-disabled or HTML disabled) when Status is "Playing"
 *   - Hours:                spinbutton or textbox labelled "Hours"
 *   - Completion:           textbox labelled "Completion"
 *   - Rating:               group/slider/spinbutton accessible as "Rating"
 *   - Notes:                textbox labelled "Notes"
 *
 * Status hint:
 *   - When Status = "Playing", visible text "Still playing" appears in the drawer.
 *
 * Submit:
 *   - Button with accessible name "Add playthrough" (mode="add")
 *     or "Save changes" (mode="edit").
 *
 * Covered scenarios:
 * 1. Form fields render when the drawer is open.
 * 2. Run type defaults to "Replay" when existingPlaythroughCount > 0.
 * 3. Run type defaults to "First playthrough" when existingPlaythroughCount === 0.
 * 4. Finished date is disabled and "Still playing" hint shows when Status = "Playing".
 * 5. Submitting the form calls createPlaythroughFn with the entered values.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlaythroughFn } from "@/features/manage-playthrough/api/create-playthrough-fn";

import { AddEditPlaythroughDrawer } from "./add-edit-playthrough-drawer";

vi.mock("@/features/manage-playthrough/api/create-playthrough-fn", () => ({
  createPlaythroughFn: vi.fn(),
}));

const elements = {
  getDrawer: () => screen.getByRole("dialog"),
  queryDrawer: () => screen.queryByRole("dialog"),

  getTypeControl: () => screen.getByRole("group", { name: "Type" }),
  queryFirstPlaythroughOption: () =>
    screen.queryByRole("radio", { name: "First playthrough" }),
  queryReplayOption: () => screen.queryByRole("radio", { name: "Replay" }),

  getStatusControl: () => screen.getByRole("combobox", { name: "Status" }),
  getFinishedInput: () => screen.getByLabelText("Finished"),
  queryFinishedInput: () => screen.queryByLabelText("Finished"),
  queryStillPlayingHint: () => screen.queryByText("Still playing"),

  getHoursInput: () => screen.getByLabelText("Hours"),
  getNotesInput: () => screen.getByLabelText("Notes"),

  getSubmitButton: () =>
    screen.getByRole("button", { name: "Add playthrough" }),
};

const actions = {
  selectReplay: () =>
    userEvent.click(screen.getByRole("radio", { name: "Replay" })),
  selectFirstPlaythrough: () =>
    userEvent.click(screen.getByRole("radio", { name: "First playthrough" })),
  setStatus: async (label: string) => {
    await userEvent.click(elements.getStatusControl());
    await userEvent.click(screen.getByRole("option", { name: label }));
  },
  typeHours: (value: string) => userEvent.type(elements.getHoursInput(), value),
  typeNotes: (value: string) => userEvent.type(elements.getNotesInput(), value),
  submit: () => userEvent.click(elements.getSubmitButton()),
};

const defaultProps = {
  open: true,
  mode: "add" as const,
  libraryItemId: 42,
  existingPlaythroughCount: 0,
  onOpenChange: vi.fn(),
};

describe("AddEditPlaythroughDrawer", () => {
  beforeEach(() => {
    vi.mocked(createPlaythroughFn).mockReset();
    vi.mocked(createPlaythroughFn).mockResolvedValue(undefined as never);
  });

  describe("given the drawer is open in add mode", () => {
    beforeEach(() => {
      render(<AddEditPlaythroughDrawer {...defaultProps} />);
    });

    it("renders the Type control", () => {
      expect(elements.getTypeControl()).not.toBeNull();
    });

    it("renders the Status control", () => {
      expect(elements.getStatusControl()).not.toBeNull();
    });

    it("renders the Finished date input", () => {
      expect(elements.queryFinishedInput()).not.toBeNull();
    });

    it("renders the Hours input", () => {
      expect(elements.getHoursInput()).not.toBeNull();
    });

    it("renders the Notes input", () => {
      expect(elements.getNotesInput()).not.toBeNull();
    });

    it("renders the Add playthrough submit button", () => {
      expect(elements.getSubmitButton()).not.toBeNull();
    });
  });

  describe("given existingPlaythroughCount is 0 (first run)", () => {
    beforeEach(() => {
      render(
        <AddEditPlaythroughDrawer
          {...defaultProps}
          existingPlaythroughCount={0}
        />
      );
    });

    it("defaults the Type selection to First playthrough", () => {
      const firstOption = elements.queryFirstPlaythroughOption();
      expect(firstOption).not.toBeNull();
      expect((firstOption as HTMLInputElement).checked).toBe(true);
    });
  });

  describe("given existingPlaythroughCount > 0 (subsequent run)", () => {
    beforeEach(() => {
      render(
        <AddEditPlaythroughDrawer
          {...defaultProps}
          existingPlaythroughCount={1}
        />
      );
    });

    it("defaults the Type selection to Replay", () => {
      const replayOption = elements.queryReplayOption();
      expect(replayOption).not.toBeNull();
      expect((replayOption as HTMLInputElement).checked).toBe(true);
    });
  });

  describe("given the user selects Status = Playing", () => {
    beforeEach(async () => {
      render(<AddEditPlaythroughDrawer {...defaultProps} />);
      await actions.setStatus("Playing");
    });

    it("disables the Finished date input", () => {
      const finished = elements.queryFinishedInput();
      expect(finished).not.toBeNull();
      expect(finished).toBeDisabled();
    });

    it("shows the Still playing hint text", () => {
      expect(elements.queryStillPlayingHint()).not.toBeNull();
    });
  });

  describe("given the user fills in hours and notes and submits", () => {
    beforeEach(async () => {
      render(<AddEditPlaythroughDrawer {...defaultProps} />);
      await actions.typeHours("3");
      await actions.typeNotes("Great experience");
      await actions.submit();
    });

    it("calls createPlaythroughFn", async () => {
      await waitFor(() => {
        expect(vi.mocked(createPlaythroughFn)).toHaveBeenCalled();
      });
    });

    it("calls createPlaythroughFn with the libraryItemId from props", async () => {
      await waitFor(() => {
        expect(vi.mocked(createPlaythroughFn)).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              libraryItemId: defaultProps.libraryItemId,
            }),
          })
        );
      });
    });

    it("calls createPlaythroughFn with the entered hours value", async () => {
      await waitFor(() => {
        expect(vi.mocked(createPlaythroughFn)).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              playtimeHours: 3,
            }),
          })
        );
      });
    });

    it("calls createPlaythroughFn with the entered notes value", async () => {
      await waitFor(() => {
        expect(vi.mocked(createPlaythroughFn)).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              notes: "Great experience",
            }),
          })
        );
      });
    });
  });
});
