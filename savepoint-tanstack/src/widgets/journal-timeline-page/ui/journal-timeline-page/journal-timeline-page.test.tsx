import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createJournalEntryFn } from "@/features/compose-journal-entry/api/create-journal-entry-fn";
import { deleteJournalEntryFn } from "@/features/delete-journal-entry/api/delete-journal-entry-fn";
import { updateJournalEntryFn } from "@/features/edit-journal-entry/api/update-journal-entry-fn";
import type { JournalTimelineEntry } from "@/widgets/journal-timeline";

import { JournalTimelinePage } from "./journal-timeline-page";

vi.mock("@tanstack/react-router", () => ({
  useRouter: vi.fn(() => ({ invalidate: vi.fn() })),
  Link: ({ to, children, ...rest }: any) => {
    delete rest.params;
    return (
      <a href={to} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/features/compose-journal-entry/api/create-journal-entry-fn", () => ({
  createJournalEntryFn: vi.fn(),
}));
vi.mock("@/features/edit-journal-entry/api/update-journal-entry-fn", () => ({
  updateJournalEntryFn: vi.fn(),
}));
vi.mock("@/features/delete-journal-entry/api/delete-journal-entry-fn", () => ({
  deleteJournalEntryFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeEntry(
  overrides?: Partial<JournalTimelineEntry>
): JournalTimelineEntry {
  const createdAt = overrides?.createdAt ?? new Date("2024-01-15T12:00:00Z");
  return {
    id: "entry-1",
    kind: "QUICK",
    title: null,
    content: "Tonight's session went well.",
    createdAt,
    updatedAt: createdAt,
    game: {
      id: "game-1",
      title: "Hollow Knight",
      slug: "hollow-knight",
      coverImage: null,
    },
    ...overrides,
  };
}

const elements = {
  getComposeTrigger: () =>
    screen.getByRole("button", { name: "Compose entry" }),
  queryDialog: () => screen.queryByRole("dialog"),
  getDialog: () => screen.getByRole("dialog"),
  getComposeTextarea: () => screen.getByRole("textbox", { name: "Content" }),
  queryEntryOpener: (date: string) =>
    screen.queryByRole("button", { name: `Open journal entry from ${date}` }),
  getEntryOpener: (date: string) =>
    screen.getByRole("button", { name: `Open journal entry from ${date}` }),
  queryEditButton: () => screen.queryByRole("button", { name: "Edit" }),
  queryDeleteButton: () => screen.queryByRole("button", { name: "Delete" }),
  getEditButton: () => screen.getByRole("button", { name: "Edit" }),
  getDeleteButton: () => screen.getByRole("button", { name: "Delete" }),
};

describe("JournalTimelinePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createJournalEntryFn).mockResolvedValue(undefined as never);
    vi.mocked(updateJournalEntryFn).mockResolvedValue(undefined as never);
    vi.mocked(deleteJournalEntryFn).mockResolvedValue(undefined as never);
  });

  describe("given an empty timeline", () => {
    beforeEach(() => {
      render(<JournalTimelinePage entries={[]} />);
    });

    it("renders the Compose entry trigger", () => {
      expect(elements.getComposeTrigger()).toBeDefined();
    });

    it("does not render any dialog initially", () => {
      expect(elements.queryDialog()).toBeNull();
    });
  });

  describe("given the user clicks the Compose entry trigger", () => {
    beforeEach(async () => {
      render(<JournalTimelinePage entries={[]} />);
      await userEvent.click(elements.getComposeTrigger());
    });

    it("opens a dialog", () => {
      expect(elements.queryDialog()).not.toBeNull();
    });

    it("renders the compose textarea", () => {
      expect(elements.getComposeTextarea()).toBeDefined();
    });
  });

  describe("given a timeline with one entry and the user clicks the card", () => {
    const entry = makeEntry({
      id: "entry-card-click",
      content: "Reached the second area.",
    });
    const formattedDate = new Date(entry.updatedAt).toLocaleDateString(
      "en-US",
      { month: "short", day: "2-digit", year: "numeric" }
    );

    beforeEach(async () => {
      render(<JournalTimelinePage entries={[entry]} />);
      await userEvent.click(elements.getEntryOpener(formattedDate));
    });

    it("opens the detail dialog with Edit and Delete affordances", () => {
      expect(elements.queryEditButton()).not.toBeNull();
      expect(elements.queryDeleteButton()).not.toBeNull();
    });
  });

  describe("given the user clicks Edit in the detail dialog", () => {
    const entry = makeEntry({
      id: "entry-edit-target",
      content: "Original content",
    });
    const formattedDate = new Date(entry.updatedAt).toLocaleDateString(
      "en-US",
      { month: "short", day: "2-digit", year: "numeric" }
    );

    beforeEach(async () => {
      render(<JournalTimelinePage entries={[entry]} />);
      await userEvent.click(elements.getEntryOpener(formattedDate));
      await userEvent.click(elements.getEditButton());
    });

    it("renders the edit dialog content textarea", () => {
      // After Edit is clicked, the detail dialog is replaced by the edit
      // dialog — the textarea (compose/edit share the aria-label) is
      // visible. Confirms routing detail -> edit dialog.
      expect(elements.getComposeTextarea()).toBeDefined();
    });
  });

  describe("given the user clicks Delete in the detail dialog", () => {
    const entry = makeEntry({
      id: "entry-delete-target",
      content: "To be deleted",
    });
    const formattedDate = new Date(entry.updatedAt).toLocaleDateString(
      "en-US",
      { month: "short", day: "2-digit", year: "numeric" }
    );

    beforeEach(async () => {
      render(<JournalTimelinePage entries={[entry]} />);
      await userEvent.click(elements.getEntryOpener(formattedDate));
      await userEvent.click(elements.getDeleteButton());
      // Submit the delete confirm
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    });

    it("calls deleteJournalEntryFn with the entry id", () => {
      expect(vi.mocked(deleteJournalEntryFn)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ entryId: "entry-delete-target" }),
        })
      );
    });
  });
});
