import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { JournalEntryPage } from "./journal-entry-page";
import type { JournalEntryPageEntry } from "./journal-entry-page.type";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, params, children, ...rest }: any) => {
    const href =
      to === "/journal/$id/edit" && params?.id
        ? `/journal/${params.id}/edit`
        : to === "/games/$slug" && params?.slug
          ? `/games/${params.slug}`
          : to;
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/features/delete-journal-entry/api/delete-journal-entry-fn", () => ({
  deleteJournalEntryFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const entry: JournalEntryPageEntry = {
  id: "entry-55",
  content: "I finally cleared the final dungeon.",
  playedMinutes: 90,
  createdAt: new Date("2024-03-10T12:00:00Z"),
  game: {
    id: "game-55",
    title: "Tunic",
    slug: "tunic",
  },
};

const elements = {
  getBody: () => screen.getByText("I finally cleared the final dungeon."),
  getEditLink: () => screen.getByRole("link", { name: "Edit" }),
  getDeleteButton: () => screen.getByRole("button", { name: "Delete" }),
  getGameLink: () => screen.getByRole("link", { name: "Tunic" }),
};

describe("JournalEntryPage", () => {
  beforeEach(() => {
    render(<JournalEntryPage entry={entry} />);
  });

  describe("given a note with text and 90 minutes", () => {
    it("shows the time as 1.5 h played", () => {
      expect(screen.getByText("1.5 h played")).toBeDefined();
    });

    it("shows the date the note was written", () => {
      expect(screen.getByText("Mar 10, 2024")).toBeDefined();
    });

    it("shows no Quick note or Reflection label", () => {
      expect(screen.queryByText(/quick note|reflection/i)).toBeNull();
    });
  });

  describe("given an entry tied to a game", () => {
    it("renders the note text", () => {
      expect(elements.getBody()).toBeDefined();
    });

    it("links Edit to the entry's edit page", () => {
      expect(elements.getEditLink()).toHaveAttribute(
        "href",
        "/journal/entry-55/edit"
      );
    });

    it("renders a Delete affordance", () => {
      expect(elements.getDeleteButton()).toBeDefined();
    });

    it("links the game name to the game detail page", () => {
      expect(elements.getGameLink()).toHaveAttribute("href", "/games/tunic");
    });
  });
});

describe("JournalEntryPage with time and no text", () => {
  beforeEach(() => {
    render(<JournalEntryPage entry={{ ...entry, content: "" }} />);
  });

  it("shows the time played without an empty text block", () => {
    expect(screen.getByText("1.5 h played")).toBeDefined();
  });
});
