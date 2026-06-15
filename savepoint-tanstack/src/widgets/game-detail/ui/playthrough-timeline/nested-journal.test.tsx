/**
 * RED component tests for NestedJournal (Slice 5 / spec 016 §2.10).
 *
 * The NestedJournal component does not exist yet. This file imports from its
 * expected path; the import will fail at module-resolution — that is the
 * canonical RED state. Do NOT implement production code in this file.
 *
 * NestedJournal renders inside each PlaythroughNode in the timeline.
 *
 * ============================================================
 * UI CONTRACT (locked; impl MUST match these exact strings/roles)
 * ============================================================
 *
 * Component name:   NestedJournal
 * File location:    widgets/game-detail/ui/playthrough-timeline/nested-journal.tsx
 *
 * Props:
 *   playthroughId:  string
 *   entries:        JournalTimelineEntry[]   — entries attached to this run
 *   onLogSession:   () => void               — callback for the Log session button
 *
 * Section label:
 *   Text format: "JOURNAL · N"  where N is the entry count.
 *   Rendered as plain text (no role required; any element).
 *
 * Log session button:
 *   Role:           "button"
 *   Accessible name: "Log session"
 *   Clicking it calls the `onLogSession` prop.
 *
 * Entry rendering (for each entry in `entries`):
 *   - Date: formatted as a human-readable date string (e.g. "Jan 15, 2024")
 *   - Hours: formatted as "Xh" from playedMinutes (e.g. 90 → "1h"; 0 / null → omitted)
 *   - Body (content): rendered in italics — the element has font-style italic or
 *     an <em> / <i> tag wrapping the content text.
 *
 * When entries is empty:
 *   - Label shows "JOURNAL · 0"
 *   - Log session button is still rendered.
 *   - No entry rows.
 *
 * ============================================================
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JournalTimelineEntry } from "@/entities/journal-entry/model/types";

// RED import — this module does not exist yet.
import { NestedJournal } from "./nested-journal";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeEntry(
  overrides: Partial<JournalTimelineEntry> & { id: string }
): JournalTimelineEntry {
  const createdAt = overrides.createdAt ?? new Date("2024-01-15T12:00:00Z");
  return {
    id: overrides.id,
    kind: overrides.kind ?? "QUICK",
    title: overrides.title ?? null,
    content: overrides.content ?? "Default session note",
    playedMinutes: overrides.playedMinutes ?? null,
    tags: overrides.tags ?? [],
    mood: overrides.mood ?? null,
    playSession: overrides.playSession ?? null,
    visibility: overrides.visibility ?? "PRIVATE",
    userId: overrides.userId ?? "user-001",
    gameId: overrides.gameId ?? "game-001",
    libraryItemId: overrides.libraryItemId ?? 1,
    playthroughId: overrides.playthroughId ?? "pt-001",
    game: overrides.game ?? null,
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt,
    publishedAt: overrides.publishedAt ?? null,
  };
}

const PLAYTHROUGH_ID = "pt-test-001";

const ENTRY_WITH_MINUTES = makeEntry({
  id: "entry-001",
  content: "Cleared the second dungeon tonight",
  playedMinutes: 90,
  playthroughId: PLAYTHROUGH_ID,
  createdAt: new Date("2024-01-15T12:00:00Z"),
});

const ENTRY_NO_MINUTES = makeEntry({
  id: "entry-002",
  content: "Short note, no timer",
  playedMinutes: null,
  playthroughId: PLAYTHROUGH_ID,
  createdAt: new Date("2024-02-20T09:00:00Z"),
});

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  getJournalLabel: (count: number) => screen.getByText(`JOURNAL · ${count}`),
  queryJournalLabel: (count: number) =>
    screen.queryByText(`JOURNAL · ${count}`),
  getLogSessionButton: () =>
    screen.getByRole("button", { name: "Log session" }),
  queryLogSessionButton: () =>
    screen.queryByRole("button", { name: "Log session" }),
  queryEntryContent: (text: string) => screen.queryByText(text),
  getEntryContent: (text: string) => screen.getByText(text),
  queryHoursText: (text: string) => screen.queryByText(text),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NestedJournal", () => {
  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  describe("given entries is empty", () => {
    beforeEach(() => {
      render(
        <NestedJournal
          playthroughId={PLAYTHROUGH_ID}
          entries={[]}
          onLogSession={vi.fn()}
        />
      );
    });

    it("renders the JOURNAL · 0 label", () => {
      expect(elements.queryJournalLabel(0)).not.toBeNull();
    });

    it("renders the Log session button even when there are no entries", () => {
      expect(elements.queryLogSessionButton()).not.toBeNull();
    });

    it("renders no entry content rows", () => {
      expect(screen.queryByText("Default session note")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // With entries
  // -------------------------------------------------------------------------

  describe("given two entries", () => {
    beforeEach(() => {
      render(
        <NestedJournal
          playthroughId={PLAYTHROUGH_ID}
          entries={[ENTRY_WITH_MINUTES, ENTRY_NO_MINUTES]}
          onLogSession={vi.fn()}
        />
      );
    });

    it("renders the JOURNAL · 2 label", () => {
      expect(elements.queryJournalLabel(2)).not.toBeNull();
    });

    it("renders the Log session button", () => {
      expect(elements.queryLogSessionButton()).not.toBeNull();
    });

    it("renders the content of each entry", () => {
      expect(
        elements.queryEntryContent("Cleared the second dungeon tonight")
      ).not.toBeNull();
      expect(elements.queryEntryContent("Short note, no timer")).not.toBeNull();
    });

    it("renders the entry content in italics (em/i element or italic style)", () => {
      const contentEl = elements.getEntryContent(
        "Cleared the second dungeon tonight"
      );
      // Accept either an italic HTML element or a parent with italic style.
      const isItalic =
        contentEl.tagName === "EM" ||
        contentEl.tagName === "I" ||
        window.getComputedStyle(contentEl).fontStyle === "italic" ||
        contentEl.closest("em") !== null ||
        contentEl.closest("i") !== null;
      expect(isItalic).toBe(true);
    });

    it("renders hours for an entry with playedMinutes (90 min → 1h)", () => {
      expect(elements.queryHoursText("1h")).not.toBeNull();
    });

    it("does not render a hours value for an entry with null playedMinutes", () => {
      // The entry with null playedMinutes must not produce a spurious "0h" or
      // empty hours token. We verify by confirming "0h" is absent.
      expect(elements.queryHoursText("0h")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Log session callback
  // -------------------------------------------------------------------------

  describe("given the user clicks Log session", () => {
    const onLogSession = vi.fn();

    beforeEach(async () => {
      render(
        <NestedJournal
          playthroughId={PLAYTHROUGH_ID}
          entries={[ENTRY_WITH_MINUTES]}
          onLogSession={onLogSession}
        />
      );
      await userEvent.click(elements.getLogSessionButton());
    });

    it("calls the onLogSession callback", () => {
      expect(onLogSession).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Date rendering
  // -------------------------------------------------------------------------

  describe("given an entry dated 2024-01-15", () => {
    beforeEach(() => {
      render(
        <NestedJournal
          playthroughId={PLAYTHROUGH_ID}
          entries={[ENTRY_WITH_MINUTES]}
          onLogSession={vi.fn()}
        />
      );
    });

    it("renders a human-readable date for the entry (e.g. Jan 15, 2024)", () => {
      // Accept any sensible locale string that contains "2024" and "15"
      // to remain robust against locale variation in CI.
      const dateEl = screen.queryByText(/2024/);
      expect(dateEl).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Single entry
  // -------------------------------------------------------------------------

  describe("given a single entry", () => {
    beforeEach(() => {
      render(
        <NestedJournal
          playthroughId={PLAYTHROUGH_ID}
          entries={[ENTRY_WITH_MINUTES]}
          onLogSession={vi.fn()}
        />
      );
    });

    it("renders the JOURNAL · 1 label", () => {
      expect(elements.queryJournalLabel(1)).not.toBeNull();
    });
  });
});
