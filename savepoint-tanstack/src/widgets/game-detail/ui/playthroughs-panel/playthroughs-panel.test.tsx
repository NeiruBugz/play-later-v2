import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlaythroughWithEntries } from "@/entities/playthrough";

import { PlaythroughsPanel } from "./playthroughs-panel";

vi.mock("@/features/manage-playthrough/api/delete-playthrough-fn", () => ({
  deletePlaythroughFn: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type PartialPlaythrough = Omit<
  PlaythroughWithEntries,
  "createdAt" | "updatedAt" | "libraryItemId" | "libraryItem"
>;

function makePlaythrough(
  overrides: Partial<PartialPlaythrough> & { id: string }
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
  id: "pt-1",
  ordinal: 1,
  kind: "FIRST",
  status: "FINISHED",
  playtimeMinutes: 120,
  rating: 8,
  completion: "Platinum",
  notes: "Great game",
  platform: "PlayStation 5",
  startedAt: new Date("2024-01-01"),
  finishedAt: new Date("2024-02-01"),
  journalEntries: [],
});

const SECOND_RUN = makePlaythrough({
  id: "pt-2",
  ordinal: 2,
  kind: "REPLAY",
  status: "PLAYING",
  playtimeMinutes: 60,
  rating: null,
  completion: null,
  notes: null,
  platform: "PC (Microsoft Windows)",
  journalEntries: [],
});

// ---------------------------------------------------------------------------
// Element and action maps
// ---------------------------------------------------------------------------

const elements = {
  querySectionHeading: () =>
    screen.queryByRole("heading", { name: "// PLAYTHROUGHS" }),
  queryEmptyHeading: () => screen.queryByText("No playthroughs yet"),
  getFirstPlaythroughButton: () =>
    screen.getByRole("button", { name: "Log your first playthrough" }),
  queryFirstPlaythroughButton: () =>
    screen.queryByRole("button", { name: "Log your first playthrough" }),
  queryPlaytimeValue: (text: string) => screen.queryByText(text),
  queryPlaythroughsCount: (text: string) => screen.queryByText(text),
  queryCompletionBadge: (text: string) => screen.queryByText(text),
  queryReadOnlyRating: () => screen.queryByRole("img", { name: /stars/i }),
  queryRunLabel: (text: string) => screen.queryByText(text),
  queryRunNotes: (text: string) => screen.queryByText(text),
  getAddPlaythroughButton: () =>
    screen.getByRole("button", { name: "Start a new playthrough" }),
  getAllEditButtons: () => screen.getAllByRole("button", { name: "Edit" }),
};

const actions = {
  clickFirstPlaythroughButton: async () => {
    await userEvent.click(elements.getFirstPlaythroughButton());
  },
  clickAddPlaythroughButton: async () => {
    await userEvent.click(elements.getAddPlaythroughButton());
  },
  clickFirstEditButton: async () => {
    const [firstEdit] = elements.getAllEditButtons();
    await userEvent.click(firstEdit!);
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PlaythroughsPanel", () => {
  const onAddPlaythrough = vi.fn();
  const onEditPlaythrough = vi.fn();
  const onLogSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given no playthroughs", () => {
    beforeEach(() => {
      render(
        <PlaythroughsPanel
          libraryItemId="lib-1"
          playthroughs={[]}
          onAddPlaythrough={onAddPlaythrough}
          onEditPlaythrough={onEditPlaythrough}
          onLogSession={onLogSession}
        />
      );
    });

    it("renders the // PLAYTHROUGHS section heading", () => {
      expect(elements.querySectionHeading()).not.toBeNull();
    });

    it('shows the "No playthroughs yet" heading', () => {
      expect(elements.queryEmptyHeading()).not.toBeNull();
    });

    it('renders a "Log your first playthrough" button', () => {
      expect(elements.queryFirstPlaythroughButton()).not.toBeNull();
    });

    it("calls onAddPlaythrough when the first-playthrough button is clicked", async () => {
      await actions.clickFirstPlaythroughButton();
      expect(onAddPlaythrough).toHaveBeenCalledTimes(1);
    });
  });

  describe("given two playthroughs (120 + 60 min, newest REPLAY first)", () => {
    beforeEach(() => {
      render(
        <PlaythroughsPanel
          libraryItemId="lib-1"
          playthroughs={[SECOND_RUN, FIRST_RUN]}
          onAddPlaythrough={onAddPlaythrough}
          onEditPlaythrough={onEditPlaythrough}
          onLogSession={onLogSession}
        />
      );
    });

    it("renders the // PLAYTHROUGHS section heading", () => {
      expect(elements.querySectionHeading()).not.toBeNull();
    });

    it("shows total playtime as 3h in the aggregate band", () => {
      expect(elements.queryPlaytimeValue("3h")).not.toBeNull();
    });

    it("shows the playthrough count as 2 in the aggregate band", () => {
      expect(elements.queryPlaythroughsCount("2")).not.toBeNull();
    });

    it("renders a read-only rating display for the best rating", () => {
      expect(elements.queryReadOnlyRating()).not.toBeNull();
    });

    it('shows the "Platinum" completion badge when a run carries that completion', () => {
      expect(elements.queryCompletionBadge("Platinum")).not.toBeNull();
    });

    it('lists the "First playthrough" label for the FIRST kind run', () => {
      expect(elements.queryRunLabel("First playthrough")).not.toBeNull();
    });

    it('lists the "Replay" label for the REPLAY kind run', () => {
      expect(elements.queryRunLabel("Replay")).not.toBeNull();
    });

    it("shows notes when a run has notes", () => {
      expect(elements.queryRunNotes("Great game")).not.toBeNull();
    });

    it('renders a "Start a new playthrough" affordance', () => {
      expect(elements.getAddPlaythroughButton()).not.toBeNull();
    });

    it("calls onAddPlaythrough when the add-playthrough button is clicked", async () => {
      await actions.clickAddPlaythroughButton();
      expect(onAddPlaythrough).toHaveBeenCalledTimes(1);
    });

    it("calls onEditPlaythrough when a per-run Edit button is clicked", async () => {
      await actions.clickFirstEditButton();
      expect(onEditPlaythrough).toHaveBeenCalledTimes(1);
    });
  });
});
