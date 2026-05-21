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
  kind: "QUICK",
  title: null,
  content: "I finally cleared the final dungeon.",
  createdAt: new Date("2024-03-10T12:00:00Z"),
  updatedAt: new Date("2024-03-10T12:00:00Z"),
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

  describe("given an entry tied to a game", () => {
    it("renders the entry content body", () => {
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
