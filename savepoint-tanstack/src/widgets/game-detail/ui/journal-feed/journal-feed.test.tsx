/**
 * RED component tests for JournalFeed (Slice 5 / spec 016 §2.10).
 *
 * The JournalFeed component does not exist yet. This file imports from its
 * expected path; the import will fail at module-resolution — that is the
 * canonical RED state. Do NOT implement production code in this file.
 *
 * JournalFeed is a full-width, run-aware feed rendered below the bento grid.
 * It flattens all entries across runs, newest-first, and annotates each entry
 * with the run it belongs to (derived from the run's `kind`).
 *
 * ============================================================
 * UI CONTRACT (locked; impl MUST match these exact strings/roles)
 * ============================================================
 *
 * Component name:   JournalFeed
 * File location:    widgets/game-detail/ui/journal-feed/journal-feed.tsx
 *
 * Props:
 *   playthroughs: PlaythroughWithEntries[]
 *     — the game's runs, each carrying its `journalEntries`.
 *     — JournalEntry items here have `playthroughId` set to the parent run's id.
 *
 * Visibility rule:
 *   When `playthroughs` is empty → renders nothing (null / empty fragment).
 *   This is the "no runs yet" hidden state from spec §2.11.
 *
 * Run label per entry:
 *   Derived from the parent run's `kind`:
 *     kind "FIRST"  → run label "First playthrough"
 *     kind "REPLAY" → run label "Replay"
 *   The label is rendered as visible text for each entry belonging to that run.
 *
 * Legacy entries (playthroughId === null):
 *   Entries with no playthroughId show NO run label.
 *   These come in via a synthetic "legacy" run or a flat entries prop — see
 *   implementation note below.
 *   NOTE: The component prop is `playthroughs: PlaythroughWithEntries[]`.
 *   Legacy entries have `playthroughId: null` on the JournalEntry row but are
 *   NOT attached to any run's `journalEntries`. To surface legacy entries, the
 *   caller may pass a synthetic playthrough object with kind "FIRST" but with
 *   entries whose `playthroughId` is `null`. The component must detect this
 *   mismatch and suppress the run label for such entries.
 *   Simpler alternative: add a separate `legacyEntries?: JournalTimelineEntry[]`
 *   prop for entries with no run. The impl chooses either approach; tests drive
 *   from behavior (label present / absent), not from the internal prop shape.
 *   → For this test we use a `legacyEntries` prop: if the impl rejects it,
 *     the test must be updated to match the impl's chosen prop shape.
 *
 * Ordering:
 *   All entries across runs are shown newest-first by `createdAt`.
 *
 * Entry rendering:
 *   - Date: human-readable (any locale format containing the year)
 *   - Run label: text "First playthrough" or "Replay" (omitted for legacy)
 *   - Hours: "Xh" from playedMinutes (omitted when null/0)
 *   - Body (content): rendered in italics — em/i element or italic style
 *
 * ============================================================
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { JournalTimelineEntry } from "@/entities/journal-entry/model/types";
import type { PlaythroughWithEntries } from "@/entities/playthrough";

// RED import — this module does not exist yet.
import { JournalFeed } from "./journal-feed";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeEntry(
  overrides: Partial<JournalTimelineEntry> & { id: string }
): JournalTimelineEntry {
  const createdAt = overrides.createdAt ?? new Date("2024-03-01T12:00:00Z");
  return {
    id: overrides.id,
    kind: overrides.kind ?? "QUICK",
    title: overrides.title ?? null,
    content: overrides.content ?? "Test entry content",
    playedMinutes: overrides.playedMinutes ?? null,
    tags: overrides.tags ?? [],
    mood: overrides.mood ?? null,
    playSession: overrides.playSession ?? null,
    visibility: overrides.visibility ?? "PRIVATE",
    userId: overrides.userId ?? "user-jf-001",
    gameId: overrides.gameId ?? "game-jf-001",
    libraryItemId: overrides.libraryItemId ?? 1,
    playthroughId: overrides.playthroughId ?? null,
    game: overrides.game ?? null,
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt,
    publishedAt: overrides.publishedAt ?? null,
  };
}

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
    libraryItemId: overrides.libraryItemId ?? 1,
    libraryItem: undefined as never,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };
}

const FIRST_RUN_ID = "pt-jf-first-001";
const REPLAY_RUN_ID = "pt-jf-replay-002";

const FIRST_RUN_ENTRY = makeEntry({
  id: "entry-jf-001",
  content: "Finished the prologue",
  playedMinutes: 90,
  playthroughId: FIRST_RUN_ID,
  createdAt: new Date("2024-03-10T10:00:00Z"),
});

const REPLAY_ENTRY = makeEntry({
  id: "entry-jf-002",
  content: "Started the replay on hard mode",
  playedMinutes: 60,
  playthroughId: REPLAY_RUN_ID,
  createdAt: new Date("2024-04-05T14:00:00Z"),
});

const FIRST_RUN = makePlaythrough({
  id: FIRST_RUN_ID,
  ordinal: 1,
  kind: "FIRST",
  journalEntries: [FIRST_RUN_ENTRY],
});

const REPLAY_RUN = makePlaythrough({
  id: REPLAY_RUN_ID,
  ordinal: 2,
  kind: "REPLAY",
  journalEntries: [REPLAY_ENTRY],
});

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  // Feed renders nothing when hidden
  queryFeedContainer: () =>
    screen.queryByRole("feed") ?? screen.queryByRole("list"),
  // Run label text
  queryRunLabel: (label: string) => screen.queryByText(label),
  getAllRunLabels: (label: string) => screen.queryAllByText(label),
  // Entry content
  queryEntryContent: (text: string) => screen.queryByText(text),
  // Hours
  queryHours: (text: string) => screen.queryByText(text),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("JournalFeed", () => {
  // -------------------------------------------------------------------------
  // Hidden when playthroughs is empty (spec §2.11)
  // -------------------------------------------------------------------------

  describe("given playthroughs is empty", () => {
    beforeEach(() => {
      render(<JournalFeed playthroughs={[]} />);
    });

    it("renders nothing (feed is hidden when the game has no runs)", () => {
      // The whole feed must be absent from the DOM.
      expect(elements.queryFeedContainer()).toBeNull();
      // Also ensure no stray entry content leaks through.
      expect(screen.queryByText("Finished the prologue")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Run labels — FIRST kind → "First playthrough"
  // -------------------------------------------------------------------------

  describe("given a FIRST run with one entry", () => {
    beforeEach(() => {
      render(<JournalFeed playthroughs={[FIRST_RUN]} />);
    });

    it("shows the 'First playthrough' run label for the entry", () => {
      expect(elements.queryRunLabel("First playthrough")).not.toBeNull();
    });

    it("renders the entry content", () => {
      expect(
        elements.queryEntryContent("Finished the prologue")
      ).not.toBeNull();
    });

    it("renders hours from playedMinutes (90 min → 1h)", () => {
      expect(elements.queryHours("1h")).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Run labels — REPLAY kind → "Replay"
  // -------------------------------------------------------------------------

  describe("given a REPLAY run with one entry", () => {
    beforeEach(() => {
      render(<JournalFeed playthroughs={[REPLAY_RUN]} />);
    });

    it("shows the 'Replay' run label for the entry", () => {
      expect(elements.queryRunLabel("Replay")).not.toBeNull();
    });

    it("renders the replay entry content", () => {
      expect(
        elements.queryEntryContent("Started the replay on hard mode")
      ).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Multiple runs — both labels present, newest first
  // -------------------------------------------------------------------------

  describe("given a FIRST run and a REPLAY run with entries", () => {
    beforeEach(() => {
      render(<JournalFeed playthroughs={[FIRST_RUN, REPLAY_RUN]} />);
    });

    it("shows 'First playthrough' label for the first-run entry", () => {
      expect(elements.queryRunLabel("First playthrough")).not.toBeNull();
    });

    it("shows 'Replay' label for the replay-run entry", () => {
      expect(elements.queryRunLabel("Replay")).not.toBeNull();
    });

    it("renders both entry contents", () => {
      expect(
        elements.queryEntryContent("Finished the prologue")
      ).not.toBeNull();
      expect(
        elements.queryEntryContent("Started the replay on hard mode")
      ).not.toBeNull();
    });

    it("orders entries newest-first (replay entry 2024-04-05 before first-run entry 2024-03-10)", () => {
      const allContent = screen.getAllByRole("article");
      // The replay entry is newer; it must appear before the first-run entry.
      const replayIndex = allContent.findIndex((el) =>
        el.textContent?.includes("Started the replay on hard mode")
      );
      const firstRunIndex = allContent.findIndex((el) =>
        el.textContent?.includes("Finished the prologue")
      );
      expect(replayIndex).toBeLessThan(firstRunIndex);
    });
  });

  // -------------------------------------------------------------------------
  // Legacy entries (playthroughId === null) — no run label shown
  // -------------------------------------------------------------------------

  describe("given a legacy entry with no playthroughId", () => {
    const legacyEntry = makeEntry({
      id: "entry-jf-legacy-001",
      content: "Old journal entry from before runs",
      playedMinutes: null,
      playthroughId: null,
      createdAt: new Date("2023-06-01T08:00:00Z"),
    });

    beforeEach(() => {
      // Pass the legacy entry via a prop that the impl supports.
      // If the impl uses a `legacyEntries` prop, it is accepted here.
      // If the impl instead detects playthroughId===null inside journalEntries
      // on a run, the test fixture must be adjusted to match — but the
      // observable behavior (no run label) is identical.
      render(
        <JournalFeed playthroughs={[FIRST_RUN]} legacyEntries={[legacyEntry]} />
      );
    });

    it("renders the legacy entry content", () => {
      expect(
        elements.queryEntryContent("Old journal entry from before runs")
      ).not.toBeNull();
    });

    it("does NOT show a run label for the legacy entry", () => {
      // Confirm neither "First playthrough" nor "Replay" appears next to
      // the legacy entry. The simplest assertion: if FIRST_RUN has no
      // entries of its own, no run label appears at all; if it does, we can
      // only assert the legacy entry's article has no run label child.
      // We use a stable approach: count run-label occurrences.
      // FIRST_RUN has one entry ("Finished the prologue") → one label.
      // The legacy entry must not add another label.
      const labels = elements.getAllRunLabels("First playthrough");
      // One label from FIRST_RUN_ENTRY, not two.
      expect(labels).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Entry body rendered in italics
  // -------------------------------------------------------------------------

  describe("given an entry with content", () => {
    beforeEach(() => {
      render(<JournalFeed playthroughs={[FIRST_RUN]} />);
    });

    it("renders the entry body in italics", () => {
      const contentEl = elements.queryEntryContent("Finished the prologue");
      expect(contentEl).not.toBeNull();
      const isItalic =
        contentEl!.tagName === "EM" ||
        contentEl!.tagName === "I" ||
        window.getComputedStyle(contentEl!).fontStyle === "italic" ||
        contentEl!.closest("em") !== null ||
        contentEl!.closest("i") !== null;
      expect(isItalic).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Hours omitted when playedMinutes is null
  // -------------------------------------------------------------------------

  describe("given an entry with null playedMinutes", () => {
    const entryNoMinutes = makeEntry({
      id: "entry-jf-no-min-001",
      content: "Note with no time",
      playedMinutes: null,
      playthroughId: FIRST_RUN_ID,
    });

    const runWithNoMinutes = makePlaythrough({
      id: FIRST_RUN_ID,
      kind: "FIRST",
      journalEntries: [entryNoMinutes],
    });

    beforeEach(() => {
      render(<JournalFeed playthroughs={[runWithNoMinutes]} />);
    });

    it("does not render a '0h' token for entries with null playedMinutes", () => {
      expect(elements.queryHours("0h")).toBeNull();
    });
  });
});
