/**
 * RED component tests for LogSessionDrawer (Slice 5 / spec 016 §2.5).
 *
 * The component does not exist yet. This file imports from its expected path;
 * the import will fail at module-resolution — that is the canonical RED state.
 * Do NOT implement production code in this file.
 *
 * ============================================================
 * UI CONTRACT (locked; impl MUST match these exact strings/roles)
 * ============================================================
 *
 * Component name:   LogSessionDrawer
 * File location:    features/compose-journal-entry/ui/log-session-drawer/
 *   log-session-drawer.tsx
 *
 * Props:
 *   open:                      boolean
 *   onOpenChange:              (open: boolean) => void
 *   playthroughs:              PlaythroughWithEntries[]   — the game's runs
 *   preselectedPlaythroughId:  string                     — run to preselect in the picker
 *   gameId:                    string                     — passed through to createJournalEntryFn
 *
 * Run picker:
 *   Each run option is a radio/select option with accessible name composed of
 *   the KIND_LABEL ("First playthrough" | "Replay") followed by the platform
 *   when set, e.g. "First playthrough" or "First playthrough · PS5".
 *   When no platform: just the kind label.
 *   The picker is preselected to `preselectedPlaythroughId` on open.
 *   Switching the picker changes the selected run.
 *
 * Thoughts / content field:
 *   Role:           "textbox"
 *   Accessible name: "Thoughts"
 *   Optional — submitting with an empty Thoughts field is valid.
 *   Helper text (visible in DOM): "Logging playtime alone is a complete entry."
 *
 * Hours played field:
 *   Role:           "spinbutton"
 *   Accessible name: "Hours played"
 *
 * Submit button:
 *   Accessible name: "Log session"
 *
 * Cancel button:
 *   Accessible name: "Cancel"
 *
 * On submit, calls createJournalEntryFn with:
 *   {
 *     data: {
 *       content:        string (may be empty)
 *       gameId:         string (from prop)
 *       playedMinutes:  number (hours * 60)
 *       playthroughId:  string (selected run id)
 *     }
 *   }
 *
 * ============================================================
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlaythroughWithEntries } from "@/entities/playthrough";
import { createJournalEntryFn } from "@/features/compose-journal-entry/api/create-journal-entry-fn";

// RED import — this module does not exist yet.
import { LogSessionDrawer } from "./log-session-drawer";

vi.mock("@/features/compose-journal-entry/api/create-journal-entry-fn", () => ({
  createJournalEntryFn: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: vi.fn(() => ({ invalidate: vi.fn() })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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

const FIRST_RUN = makePlaythrough({
  id: "run-first-001",
  ordinal: 1,
  kind: "FIRST",
  status: "FINISHED",
  platform: "PS5",
});

const REPLAY_RUN = makePlaythrough({
  id: "run-replay-002",
  ordinal: 2,
  kind: "REPLAY",
  status: "PLAYING",
  platform: "PC (Microsoft Windows)",
});

const GAME_ID = "game-ls-001";

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  getThoughtsField: () => screen.getByRole("textbox", { name: "Thoughts" }),
  queryThoughtsField: () => screen.queryByRole("textbox", { name: "Thoughts" }),
  getHoursField: () => screen.getByRole("spinbutton", { name: "Hours played" }),
  queryHoursField: () =>
    screen.queryByRole("spinbutton", { name: "Hours played" }),
  getLogSessionButton: () =>
    screen.getByRole("button", { name: "Log session" }),
  getCancelButton: () => screen.getByRole("button", { name: "Cancel" }),
  getHelperText: () =>
    screen.getByText("Logging playtime alone is a complete entry."),
  queryHelperText: () =>
    screen.queryByText("Logging playtime alone is a complete entry."),
  // Run picker options — identified by their label text
  getRunOption: (label: string) => screen.getByRole("radio", { name: label }),
  queryRunOption: (label: string) =>
    screen.queryByRole("radio", { name: label }),
};

// ---------------------------------------------------------------------------
// Action vocabulary
// ---------------------------------------------------------------------------

const actions = {
  typeThoughts: (text: string) =>
    userEvent.type(elements.getThoughtsField(), text),
  typeHours: (value: string) => userEvent.type(elements.getHoursField(), value),
  clearHours: () => userEvent.clear(elements.getHoursField()),
  selectRun: (label: string) => userEvent.click(elements.getRunOption(label)),
  submit: () => userEvent.click(elements.getLogSessionButton()),
  cancel: () => userEvent.click(elements.getCancelButton()),
};

// ---------------------------------------------------------------------------
// Base props
// ---------------------------------------------------------------------------

const baseProps = {
  open: true,
  onOpenChange: vi.fn(),
  playthroughs: [FIRST_RUN, REPLAY_RUN],
  preselectedPlaythroughId: FIRST_RUN.id,
  gameId: GAME_ID,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LogSessionDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createJournalEntryFn).mockResolvedValue(undefined as never);
  });

  // -------------------------------------------------------------------------
  // Structure
  // -------------------------------------------------------------------------

  describe("given the drawer is open with two runs", () => {
    beforeEach(() => {
      render(<LogSessionDrawer {...baseProps} />);
    });

    it("renders the Thoughts text field", () => {
      expect(elements.queryThoughtsField()).not.toBeNull();
    });

    it("renders the Hours played number field", () => {
      expect(elements.queryHoursField()).not.toBeNull();
    });

    it("renders the Log session submit button", () => {
      expect(elements.getLogSessionButton()).not.toBeNull();
    });

    it("renders the Cancel button", () => {
      expect(elements.getCancelButton()).not.toBeNull();
    });

    it("shows helper text that thoughts are optional", () => {
      expect(elements.queryHelperText()).not.toBeNull();
    });

    it("renders run picker options for each run", () => {
      // FIRST run has platform "PS5" → option label is "First playthrough · PS5"
      expect(elements.queryRunOption("First playthrough · PS5")).not.toBeNull();
      // REPLAY run has a platform too
      expect(
        elements.queryRunOption("Replay · PC (Microsoft Windows)")
      ).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Preselection
  // -------------------------------------------------------------------------

  describe("given preselectedPlaythroughId points to FIRST_RUN", () => {
    beforeEach(() => {
      render(<LogSessionDrawer {...baseProps} />);
    });

    it("has the First playthrough option preselected", () => {
      const option = elements.getRunOption("First playthrough · PS5");
      expect((option as HTMLInputElement).checked).toBe(true);
    });

    it("does not preselect the Replay option", () => {
      const option = elements.getRunOption("Replay · PC (Microsoft Windows)");
      expect((option as HTMLInputElement).checked).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Switching the run picker
  // -------------------------------------------------------------------------

  describe("given the user switches the run picker to the Replay run", () => {
    beforeEach(async () => {
      render(<LogSessionDrawer {...baseProps} />);
      await actions.selectRun("Replay · PC (Microsoft Windows)");
    });

    it("marks the Replay option as selected", () => {
      const option = elements.getRunOption("Replay · PC (Microsoft Windows)");
      expect((option as HTMLInputElement).checked).toBe(true);
    });

    it("deselects the First playthrough option", () => {
      const option = elements.getRunOption("First playthrough · PS5");
      expect((option as HTMLInputElement).checked).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Submit with thoughts and hours → calls fn with playthroughId + playedMinutes
  // -------------------------------------------------------------------------

  describe("given the user enters 2 hours and a thought, then submits", () => {
    beforeEach(async () => {
      render(<LogSessionDrawer {...baseProps} />);
      await actions.typeThoughts("Great session tonight");
      await actions.clearHours();
      await actions.typeHours("2");
      await actions.submit();
    });

    it("calls createJournalEntryFn with content, gameId, playedMinutes, and playthroughId", () => {
      expect(vi.mocked(createJournalEntryFn)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: "Great session tonight",
            gameId: GAME_ID,
            playedMinutes: 120, // 2 hours * 60
            playthroughId: FIRST_RUN.id,
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Submit with empty thoughts — thoughts are optional
  // -------------------------------------------------------------------------

  describe("given the user enters hours but leaves thoughts empty, then submits", () => {
    beforeEach(async () => {
      render(<LogSessionDrawer {...baseProps} />);
      await actions.clearHours();
      await actions.typeHours("1");
      // Thoughts deliberately left empty
      await actions.submit();
    });

    it("calls createJournalEntryFn with empty content (thoughts are optional)", () => {
      expect(vi.mocked(createJournalEntryFn)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: "",
            playedMinutes: 60,
            playthroughId: FIRST_RUN.id,
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Submit after switching run — uses the switched run id
  // -------------------------------------------------------------------------

  describe("given the user switches to the Replay run and submits", () => {
    beforeEach(async () => {
      render(<LogSessionDrawer {...baseProps} />);
      await actions.selectRun("Replay · PC (Microsoft Windows)");
      await actions.clearHours();
      await actions.typeHours("3");
      await actions.submit();
    });

    it("calls createJournalEntryFn with the selected Replay run's playthroughId", () => {
      expect(vi.mocked(createJournalEntryFn)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            playthroughId: REPLAY_RUN.id,
            playedMinutes: 180,
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Cancel closes the drawer
  // -------------------------------------------------------------------------

  describe("given the user clicks Cancel", () => {
    const onOpenChange = vi.fn();

    beforeEach(async () => {
      render(<LogSessionDrawer {...baseProps} onOpenChange={onOpenChange} />);
      await actions.cancel();
    });

    it("calls onOpenChange(false) to close the drawer", () => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // -------------------------------------------------------------------------
  // Run picker with no platform — label is just the kind label
  // -------------------------------------------------------------------------

  describe("given a run with no platform set", () => {
    const noPlatformRun = makePlaythrough({
      id: "run-no-platform-003",
      ordinal: 1,
      kind: "FIRST",
      status: "FINISHED",
      platform: null,
    });

    beforeEach(() => {
      render(
        <LogSessionDrawer
          open={true}
          onOpenChange={vi.fn()}
          playthroughs={[noPlatformRun]}
          preselectedPlaythroughId={noPlatformRun.id}
          gameId={GAME_ID}
        />
      );
    });

    it("renders the run option with just the kind label (no platform suffix)", () => {
      expect(elements.queryRunOption("First playthrough")).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Bug #1 — blank hours must omit playedMinutes (not send 0 which fails .positive())
  // -------------------------------------------------------------------------

  describe("given the user enters a thought but leaves hours blank, then submits", () => {
    beforeEach(async () => {
      render(<LogSessionDrawer {...baseProps} />);
      await actions.typeThoughts("Just a thought");
      // Hours field is intentionally left blank
      await actions.submit();
    });

    it("calls createJournalEntryFn with playedMinutes undefined (not 0)", () => {
      expect(vi.mocked(createJournalEntryFn)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: "Just a thought",
            playedMinutes: undefined,
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Finding 9 — submit disabled when neither thoughts nor hours are present
  // -------------------------------------------------------------------------

  describe("given the drawer is open with empty thoughts and blank hours", () => {
    beforeEach(() => {
      render(<LogSessionDrawer {...baseProps} />);
    });

    it("disables the Log session button", () => {
      expect(elements.getLogSessionButton()).toBeDisabled();
    });

    it("does not call createJournalEntryFn when the disabled button is clicked", async () => {
      await actions.submit();
      expect(vi.mocked(createJournalEntryFn)).not.toHaveBeenCalled();
    });
  });

  describe("given the user types whitespace-only thoughts and leaves hours blank", () => {
    beforeEach(async () => {
      render(<LogSessionDrawer {...baseProps} />);
      await actions.typeThoughts("   ");
    });

    it("keeps the Log session button disabled (whitespace does not count)", () => {
      expect(elements.getLogSessionButton()).toBeDisabled();
    });
  });

  describe("given the user types a thought (non-empty)", () => {
    beforeEach(async () => {
      render(<LogSessionDrawer {...baseProps} />);
      await actions.typeThoughts("Good session");
    });

    it("enables the Log session button", () => {
      expect(elements.getLogSessionButton()).toBeEnabled();
    });
  });

  describe("given the user enters positive hours and leaves thoughts empty", () => {
    beforeEach(async () => {
      render(<LogSessionDrawer {...baseProps} />);
      await actions.clearHours();
      await actions.typeHours("1");
    });

    it("enables the Log session button", () => {
      expect(elements.getLogSessionButton()).toBeEnabled();
    });
  });

  // -------------------------------------------------------------------------
  // Success path: closes drawer and invalidates router
  // -------------------------------------------------------------------------

  describe("given the server fn resolves on submit", () => {
    const onOpenChange = vi.fn();
    let invalidate: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      invalidate = vi.fn();
      const { useRouter } = await import("@tanstack/react-router");
      vi.mocked(useRouter).mockReturnValue({ invalidate } as never);

      render(<LogSessionDrawer {...baseProps} onOpenChange={onOpenChange} />);

      await actions.clearHours();
      await actions.typeHours("1");
      await actions.submit();
    });

    it("closes the drawer by calling onOpenChange(false)", async () => {
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("calls router.invalidate() after successful submit", async () => {
      await waitFor(() => {
        expect(invalidate).toHaveBeenCalled();
      });
    });
  });
});
