import { renderWithTestProviders } from "@/test/utils/test-provider";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import React from "react";

import { JournalVisibility } from "@/shared/types";

import { deleteJournalEntryAction } from "../server-actions/delete-journal-entry";
import { JournalEntryDetail } from "./journal-entry-detail";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../server-actions/delete-journal-entry", () => ({
  deleteJournalEntryAction: vi.fn(),
}));

const mockPush = vi.fn();
const mockDeleteAction = vi.mocked(deleteJournalEntryAction);

const baseEntry = {
  id: "entry-1",
  userId: "user-1",
  gameId: "game-1",
  libraryItemId: null,
  kind: "REFLECTION" as const,
  title: "My Gaming Session",
  content: "Had a great time exploring the world today.",
  playedMinutes: null,
  tags: [],
  mood: null,
  playSession: null,
  visibility: JournalVisibility.PRIVATE,
  createdAt: new Date("2024-03-15T10:00:00Z"),
  updatedAt: new Date("2024-03-15T10:00:00Z"),
  publishedAt: null,
};

const baseGame = {
  id: "game-1",
  title: "Hollow Knight",
  slug: "hollow-knight",
  coverImage: null,
};

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  } as ReturnType<typeof useRouter>);

  mockDeleteAction.mockResolvedValue({ success: true, data: undefined });
});

describe("JournalEntryDetail", () => {
  describe("page structure", () => {
    it("renders exactly one h1", () => {
      renderWithTestProviders(
        <JournalEntryDetail entry={baseEntry} game={baseGame} />
      );
      const headings = screen.getAllByRole("heading", { level: 1 });
      expect(headings).toHaveLength(1);
    });

    it("uses the persisted title as the h1 when present", () => {
      renderWithTestProviders(
        <JournalEntryDetail entry={baseEntry} game={baseGame} />
      );
      expect(
        screen.getByRole("heading", { level: 1, name: "My Gaming Session" })
      ).toBeInTheDocument();
    });

    it("derives a title from body when persisted title is null", () => {
      const entry = { ...baseEntry, title: null };
      renderWithTestProviders(
        <JournalEntryDetail entry={entry} game={baseGame} />
      );
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: /Had a great time exploring/,
        })
      ).toBeInTheDocument();
    });

    it("falls back to game — date title when title and body are both empty", () => {
      const entry = { ...baseEntry, title: null, content: "" };
      renderWithTestProviders(
        <JournalEntryDetail entry={entry} game={baseGame} />
      );
      expect(
        screen.getByRole("heading", { level: 1, name: /Hollow Knight — / })
      ).toBeInTheDocument();
    });
  });

  describe("mood eyebrow", () => {
    it("does not render mood eyebrow when mood is null", () => {
      renderWithTestProviders(
        <JournalEntryDetail entry={baseEntry} game={baseGame} />
      );
      expect(
        screen.queryByText(/hyped|chill|fried|proud|curious|nostalgic/i)
      ).not.toBeInTheDocument();
    });

    it("renders mood as an eyebrow above the title when present", () => {
      const entry = { ...baseEntry, mood: "EXCITED" as const };
      renderWithTestProviders(
        <JournalEntryDetail entry={entry} game={baseGame} />
      );
      const eyebrow = screen.getByText("Hyped");
      expect(eyebrow).toBeInTheDocument();
      expect(eyebrow.tagName).not.toBe("H1");
      expect(eyebrow.tagName).not.toBe("H2");
      expect(eyebrow).toHaveClass("text-caption");
    });
  });

  describe("card headings removed", () => {
    it("does not render a heading with text 'Game'", () => {
      renderWithTestProviders(
        <JournalEntryDetail entry={baseEntry} game={baseGame} />
      );
      const headings = screen.queryAllByRole("heading");
      const gameHeading = headings.find((h) => h.textContent === "Game");
      expect(gameHeading).toBeUndefined();
    });

    it("does not render a heading with text 'Entry'", () => {
      renderWithTestProviders(
        <JournalEntryDetail entry={baseEntry} game={baseGame} />
      );
      const headings = screen.queryAllByRole("heading");
      const entryHeading = headings.find((h) => h.textContent === "Entry");
      expect(entryHeading).toBeUndefined();
    });
  });

  describe("edit action", () => {
    it("renders an Edit link as a primary inline action", () => {
      renderWithTestProviders(
        <JournalEntryDetail entry={baseEntry} game={baseGame} />
      );
      const editLink = screen.getByRole("link", { name: /edit/i });
      expect(editLink).toBeInTheDocument();
      expect(editLink).toHaveAttribute("href", "/journal/entry-1/edit");
    });
  });

  describe("delete action behind overflow menu", () => {
    it("does not render a Delete button directly in the DOM", () => {
      renderWithTestProviders(
        <JournalEntryDetail entry={baseEntry} game={baseGame} />
      );
      expect(
        screen.queryByRole("button", { name: /^delete$/i })
      ).not.toBeInTheDocument();
    });

    it("shows 'Delete entry' menu item after opening the overflow menu", async () => {
      const user = userEvent.setup();
      renderWithTestProviders(
        <JournalEntryDetail entry={baseEntry} game={baseGame} />
      );

      await user.click(screen.getByRole("button", { name: /more actions/i }));

      expect(
        await screen.findByRole("menuitem", { name: /delete entry/i })
      ).toBeInTheDocument();
    });

    it("opens the confirmation dialog when 'Delete entry' is clicked", async () => {
      const user = userEvent.setup();
      renderWithTestProviders(
        <JournalEntryDetail entry={baseEntry} game={baseGame} />
      );

      await user.click(screen.getByRole("button", { name: /more actions/i }));
      await user.click(
        await screen.findByRole("menuitem", { name: /delete entry/i })
      );

      await waitFor(() => {
        expect(
          screen.getByRole("dialog", { name: /delete journal entry/i })
        ).toBeInTheDocument();
      });
    });

    it("does not call deleteJournalEntryAction without confirmation", async () => {
      const user = userEvent.setup();
      renderWithTestProviders(
        <JournalEntryDetail entry={baseEntry} game={baseGame} />
      );

      await user.click(screen.getByRole("button", { name: /more actions/i }));
      await user.click(
        await screen.findByRole("menuitem", { name: /delete entry/i })
      );

      await waitFor(() => {
        expect(
          screen.getByRole("dialog", { name: /delete journal entry/i })
        ).toBeInTheDocument();
      });

      expect(mockDeleteAction).not.toHaveBeenCalled();
    });

    it("calls deleteJournalEntryAction after confirming deletion", async () => {
      const user = userEvent.setup();
      renderWithTestProviders(
        <JournalEntryDetail entry={baseEntry} game={baseGame} />
      );

      await user.click(screen.getByRole("button", { name: /more actions/i }));
      await user.click(
        await screen.findByRole("menuitem", { name: /delete entry/i })
      );

      await waitFor(() => {
        expect(
          screen.getByRole("dialog", { name: /delete journal entry/i })
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /confirm deletion/i })
      );

      await waitFor(() => {
        expect(mockDeleteAction).toHaveBeenCalledWith({ entryId: "entry-1" });
      });
    });
  });
});
