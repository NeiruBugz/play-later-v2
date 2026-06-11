/**
 * RED component test for ProfilePlaythroughsSection (Spec 016 Slice 8).
 *
 * The component does not exist yet — the import below is the RED signal.
 * Do not implement production code in this file.
 *
 * ============================================================
 * CONTRACT (locked here; GREEN agent must not deviate without
 * updating this comment block)
 * ============================================================
 *
 * Component: ProfilePlaythroughsSection
 * Location:  widgets/profile-overview/ui/profile-playthroughs-section/
 * Export:    named export `ProfilePlaythroughsSection`
 *
 * Props:
 *   playthroughs: ProfilePlaythrough[]
 *
 *   where ProfilePlaythrough matches the entity query return shape:
 *   {
 *     id: string;
 *     kind: "FIRST" | "REPLAY";
 *     status: "PLAYING" | "FINISHED" | "ABANDONED";
 *     platform: string | null;
 *     startedAt: Date | null;
 *     finishedAt: Date | null;
 *     rating: number | null;
 *     notes: string | null;
 *     game: { title: string; slug: string; coverImage: string | null };
 *   }
 *
 * Testability hooks:
 *   - Game title link: `screen.getByRole("link", { name: game.title })` — href resolves
 *     to `/games/${slug}` via the Link mock below (to="/games/$slug", params={ slug }).
 *   - "in progress" text: `screen.getByText("in progress")` on any run where
 *     `finishedAt` is null.
 *   - Empty → nothing: when `playthroughs` is `[]`, the component renders null (returns
 *     nothing); assert via `container.firstChild === null` or `queryByRole("list")`.
 *   - Rating: present only when `rating` is non-null; query via test-id
 *     `data-testid="run-rating"` wrapping the displayed value.
 *   - Notes: present only when `notes` is non-null; text content equals the note string.
 *   - Order: runs appear in the DOM in the order supplied — caller (route) passes newest-
 *     first; the component does NOT re-sort.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { ProfilePlaythroughsSection } from "./profile-playthroughs-section";
import type { ProfilePlaythroughsSectionProps } from "./profile-playthroughs-section.type";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, params, children, ...rest }: any) => {
    const href =
      to === "/games/$slug" && params?.slug ? `/games/${params.slug}` : to;
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type PT = ProfilePlaythroughsSectionProps["playthroughs"][number];

const finishedRun: PT = {
  id: "run-1",
  kind: "FIRST",
  status: "FINISHED",
  platform: "PS5",
  startedAt: new Date("2024-01-10T00:00:00.000Z"),
  finishedAt: new Date("2024-02-20T00:00:00.000Z"),
  rating: 9,
  notes: "Amazing run, got the platinum.",
  game: {
    title: "Elden Ring",
    slug: "elden-ring",
    coverImage: "/covers/elden-ring.jpg",
  },
};

const playingRun: PT = {
  id: "run-2",
  kind: "REPLAY",
  status: "PLAYING",
  platform: "PC",
  startedAt: new Date("2024-05-01T00:00:00.000Z"),
  finishedAt: null,
  rating: null,
  notes: null,
  game: {
    title: "Hollow Knight",
    slug: "hollow-knight",
    coverImage: "/covers/hollow-knight.jpg",
  },
};

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  querySection: () => screen.queryByRole("list"),
  getGameLink: (title: string) => screen.getByRole("link", { name: title }),
  queryGameLink: (title: string) => screen.queryByRole("link", { name: title }),
  getAllGameLinks: () =>
    screen
      .queryAllByRole("link")
      .filter((el) => el.getAttribute("href")?.startsWith("/games/")),
  queryInProgress: () => screen.queryByText("in progress"),
  queryRating: () => screen.queryByTestId("run-rating"),
  getAllRatings: () => screen.queryAllByTestId("run-rating"),
  queryNotes: (text: string) => screen.queryByText(text),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProfilePlaythroughsSection", () => {
  describe("given playthroughs is empty", () => {
    it("renders nothing", () => {
      render(<ProfilePlaythroughsSection playthroughs={[]} />);
      expect(elements.querySection()).toBeNull();
    });

    it("does not render any game links", () => {
      render(<ProfilePlaythroughsSection playthroughs={[]} />);
      expect(elements.getAllGameLinks()).toHaveLength(0);
    });
  });

  describe("given a single FINISHED run with rating and notes", () => {
    beforeEach(() => {
      render(<ProfilePlaythroughsSection playthroughs={[finishedRun]} />);
    });

    it("renders a game title link pointing to /games/elden-ring", () => {
      expect(elements.getGameLink("Elden Ring")).toHaveAttribute(
        "href",
        "/games/elden-ring"
      );
    });

    it("renders the platform", () => {
      expect(screen.getByText("PS5")).toBeDefined();
    });

    it("does not show 'in progress' (run has a finishedAt)", () => {
      expect(elements.queryInProgress()).toBeNull();
    });

    it("renders the rating", () => {
      expect(elements.queryRating()).not.toBeNull();
    });

    it("renders the notes text", () => {
      expect(
        elements.queryNotes("Amazing run, got the platinum.")
      ).not.toBeNull();
    });
  });

  describe("given a single PLAYING run with null finishedAt, null rating, null notes", () => {
    beforeEach(() => {
      render(<ProfilePlaythroughsSection playthroughs={[playingRun]} />);
    });

    it("shows 'in progress' instead of a finished date", () => {
      expect(elements.queryInProgress()).not.toBeNull();
    });

    it("renders the game title link for the PLAYING run", () => {
      expect(elements.getGameLink("Hollow Knight")).toHaveAttribute(
        "href",
        "/games/hollow-knight"
      );
    });

    it("does not render a rating element when rating is null", () => {
      expect(elements.queryRating()).toBeNull();
    });

    it("does not render the notes when notes is null", () => {
      expect(elements.queryNotes("Amazing run, got the platinum.")).toBeNull();
    });
  });

  describe("given two runs passed newest-first", () => {
    beforeEach(() => {
      // Caller passes newest-first; component preserves order.
      render(
        <ProfilePlaythroughsSection playthroughs={[finishedRun, playingRun]} />
      );
    });

    it("renders both game title links", () => {
      expect(elements.queryGameLink("Elden Ring")).not.toBeNull();
      expect(elements.queryGameLink("Hollow Knight")).not.toBeNull();
    });

    it("renders entries in the supplied order (Elden Ring before Hollow Knight)", () => {
      const links = elements.getAllGameLinks();
      expect(links[0]).toHaveAttribute("href", "/games/elden-ring");
      expect(links[1]).toHaveAttribute("href", "/games/hollow-knight");
    });

    it("shows 'in progress' only for the PLAYING run", () => {
      // Only one "in progress" text should exist on the page.
      const matches = screen.queryAllByText("in progress");
      expect(matches).toHaveLength(1);
    });

    it("renders rating only for the run that has one", () => {
      expect(elements.getAllRatings()).toHaveLength(1);
    });
  });
});
