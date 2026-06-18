/**
 * Component tests for LogSessionContent (Spec 025 design-fidelity additions).
 *
 * CONTRACT
 * - Renders a selected-game header card when gameTitle is provided; includes cover thumbnail when coverImage is provided.
 * - Renders a playtime stepper (minus/plus buttons) that adjusts value in 0.5h increments
 * - Does NOT render a "When" segmented control (removed — no date field on the model)
 * - Renders the Reflection textarea with updated hint and placeholder copy
 * - Retains the Log session / Cancel submit flow
 *
 * NOT tested: server fn internals (tested in integration tests).
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlaythroughWithEntries } from "@/entities/playthrough";
import { createJournalEntryFn } from "@/features/compose-journal-entry/api/create-journal-entry-fn";

import { LogSessionContent } from "./log-session-content";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/features/compose-journal-entry/api/create-journal-entry-fn", () => ({
  createJournalEntryFn: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: vi.fn(() => ({ invalidate: vi.fn() })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePlaythrough(
  overrides: Partial<PlaythroughWithEntries> & { id: string }
): PlaythroughWithEntries {
  return {
    id: overrides.id,
    ordinal: overrides.ordinal ?? 1,
    kind: overrides.kind ?? "FIRST",
    status: overrides.status ?? "PLAYING",
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

const PLAYTHROUGH = makePlaythrough({
  id: "pt-abc",
  kind: "FIRST",
  status: "PLAYING",
});

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  queryGameHeader: () => screen.queryByTestId("selected-game-header"),
  getGameHeader: () => screen.getByTestId("selected-game-header"),
  queryGameTitle: (title: string) => screen.queryByText(title),
  getGameTitle: (title: string) => screen.getByText(title),

  getDecrementButton: () =>
    screen.getByRole("button", { name: "Decrease playtime by 0.5 hours" }),
  getIncrementButton: () =>
    screen.getByRole("button", { name: "Increase playtime by 0.5 hours" }),
  getPlaytimeDisplay: () =>
    screen.getByRole("spinbutton", { name: "Hours played" }),

  getReflectionField: () => screen.getByRole("textbox", { name: "Reflection" }),
  getHint: () =>
    screen.getByText("Optional — playtime alone is a complete log."),
  getLogSessionButton: () =>
    screen.getByRole("button", { name: "Log session" }),
  getCancelButton: () => screen.getByRole("button", { name: "Cancel" }),

  queryCoverImage: () => screen.queryByRole("img", { name: /Cover for/ }),
};

// ---------------------------------------------------------------------------
// Action vocabulary
// ---------------------------------------------------------------------------

const actions = {
  increment: () => userEvent.click(elements.getIncrementButton()),
  decrement: () => userEvent.click(elements.getDecrementButton()),
  typeReflection: (text: string) =>
    userEvent.type(elements.getReflectionField(), text),
  submit: () => userEvent.click(elements.getLogSessionButton()),
  cancel: () => userEvent.click(elements.getCancelButton()),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LogSessionContent", () => {
  describe("given gameTitle is provided", () => {
    beforeEach(() => {
      render(
        <LogSessionContent
          gameTitle="Hollow Knight"
          gameId="game-001"
          playthroughs={[PLAYTHROUGH]}
          preselectedPlaythroughId={PLAYTHROUGH.id}
          onClose={vi.fn()}
        />
      );
    });

    it("renders the selected-game header", () => {
      expect(elements.queryGameHeader()).not.toBeNull();
    });

    it("shows the game title in the header", () => {
      expect(elements.queryGameTitle("Hollow Knight")).not.toBeNull();
    });
  });

  describe("given gameTitle and coverImage are provided", () => {
    beforeEach(() => {
      render(
        <LogSessionContent
          gameTitle="Hollow Knight"
          gameId="game-001"
          coverImage="abc123"
          playthroughs={[PLAYTHROUGH]}
          preselectedPlaythroughId={PLAYTHROUGH.id}
          onClose={vi.fn()}
        />
      );
    });

    it("renders the cover image in the header", () => {
      expect(elements.queryCoverImage()).not.toBeNull();
    });

    it("uses the game title as the cover alt text", () => {
      expect(
        screen.getByRole("img", { name: "Cover for Hollow Knight" })
      ).not.toBeNull();
    });
  });

  describe("given gameTitle is provided but coverImage is null", () => {
    beforeEach(() => {
      render(
        <LogSessionContent
          gameTitle="Celeste"
          gameId="game-002"
          coverImage={null}
          playthroughs={[PLAYTHROUGH]}
          preselectedPlaythroughId={PLAYTHROUGH.id}
          onClose={vi.fn()}
        />
      );
    });

    it("does not render a cover image element", () => {
      expect(elements.queryCoverImage()).toBeNull();
    });
  });

  describe("given gameTitle is not provided", () => {
    beforeEach(() => {
      render(
        <LogSessionContent
          gameId="game-001"
          playthroughs={[PLAYTHROUGH]}
          preselectedPlaythroughId={PLAYTHROUGH.id}
          onClose={vi.fn()}
        />
      );
    });

    it("does not render the selected-game header", () => {
      expect(elements.queryGameHeader()).toBeNull();
    });
  });

  describe("given the form is rendered", () => {
    beforeEach(() => {
      render(
        <LogSessionContent
          gameTitle="Celeste"
          gameId="game-002"
          playthroughs={[PLAYTHROUGH]}
          preselectedPlaythroughId={PLAYTHROUGH.id}
          onClose={vi.fn()}
        />
      );
    });

    it("renders the playtime decrement button", () => {
      expect(elements.getDecrementButton()).not.toBeNull();
    });

    it("renders the playtime increment button", () => {
      expect(elements.getIncrementButton()).not.toBeNull();
    });

    it("renders the playtime spinbutton with an initial value of 0", () => {
      const display = elements.getPlaytimeDisplay();
      expect(display).not.toBeNull();
      expect(display).toHaveAttribute("aria-valuenow", "0");
    });

    it("does not render a When segmented control", () => {
      expect(screen.queryByRole("button", { name: "Today" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Yesterday" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Pick date" })).toBeNull();
    });

    it("renders the Reflection textarea", () => {
      expect(elements.getReflectionField()).not.toBeNull();
    });

    it("renders the updated hint text", () => {
      expect(elements.getHint()).not.toBeNull();
    });
  });

  describe("given the user clicks the increment button once", () => {
    beforeEach(async () => {
      render(
        <LogSessionContent
          gameId="game-001"
          playthroughs={[PLAYTHROUGH]}
          preselectedPlaythroughId={PLAYTHROUGH.id}
          onClose={vi.fn()}
        />
      );
      await actions.increment();
    });

    it("increases the displayed playtime by 0.5 hours", () => {
      const display = elements.getPlaytimeDisplay();
      expect(display).toHaveAttribute("aria-valuenow", "0.5");
    });

    it("shows 0.5 hrs in the visible playtime display", () => {
      expect(screen.getByText("0.5")).not.toBeNull();
    });
  });

  describe("given the user clicks the increment button twice", () => {
    beforeEach(async () => {
      render(
        <LogSessionContent
          gameId="game-001"
          playthroughs={[PLAYTHROUGH]}
          preselectedPlaythroughId={PLAYTHROUGH.id}
          onClose={vi.fn()}
        />
      );
      await actions.increment();
      await actions.increment();
    });

    it("displays 1 hour", () => {
      const display = elements.getPlaytimeDisplay();
      expect(display).toHaveAttribute("aria-valuenow", "1");
    });
  });

  describe("given the playtime is at 0 and the user clicks decrement", () => {
    beforeEach(async () => {
      render(
        <LogSessionContent
          gameId="game-001"
          playthroughs={[PLAYTHROUGH]}
          preselectedPlaythroughId={PLAYTHROUGH.id}
          onClose={vi.fn()}
        />
      );
      await actions.decrement();
    });

    it("does not go below 0", () => {
      const display = elements.getPlaytimeDisplay();
      expect(display).toHaveAttribute("aria-valuenow", "0");
    });
  });

  describe("given the user clicks increment then decrement", () => {
    beforeEach(async () => {
      render(
        <LogSessionContent
          gameId="game-001"
          playthroughs={[PLAYTHROUGH]}
          preselectedPlaythroughId={PLAYTHROUGH.id}
          onClose={vi.fn()}
        />
      );
      await actions.increment();
      await actions.decrement();
    });

    it("returns to 0", () => {
      const display = elements.getPlaytimeDisplay();
      expect(display).toHaveAttribute("aria-valuenow", "0");
    });
  });

  describe("given no playthroughs (selectedId is empty string)", () => {
    beforeEach(async () => {
      render(
        <LogSessionContent
          gameId="game-001"
          playthroughs={[]}
          preselectedPlaythroughId=""
          onClose={vi.fn()}
        />
      );
      await actions.increment();
      await actions.submit();
    });

    it("calls createJournalEntryFn with playthroughId undefined, not empty string", () => {
      expect(vi.mocked(createJournalEntryFn)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            playthroughId: undefined,
          }),
        })
      );
    });
  });
});
