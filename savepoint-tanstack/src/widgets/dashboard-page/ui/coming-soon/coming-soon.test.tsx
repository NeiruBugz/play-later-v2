import { render, screen, within } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ComingSoon } from "./coming-soon";

type Candidate = ComponentProps<typeof ComingSoon>["candidates"][number];

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    ...rest
  }: {
    to?: string;
    params?: Record<string, string>;
    children: ReactNode;
  }) => (
    <a
      href={(to ?? "").replace(
        /\$(\w+)/g,
        (_placeholder, name: string) => params?.[name] ?? ""
      )}
      {...rest}
    >
      {children}
    </a>
  ),
}));
vi.mock("@/shared/lib/igdb-image", () => ({
  buildCoverImageUrl: () => "https://images.igdb.com/cover.jpg",
  buildCoverImageProps: () => ({
    src: "https://images.igdb.com/cover.jpg",
    srcSet: undefined,
  }),
}));

const THURSDAY_12_NOV_2026_NOON = new Date(2026, 10, 12, 12);
const MONDAY_28_DEC_2026_NOON = new Date(2026, 11, 28, 12);

let nextLibraryItemId = 1;

function candidate(
  title: string,
  day: string,
  precision: Candidate["game"]["releaseDatePrecision"] = "DAY"
): Candidate {
  return {
    id: nextLibraryItemId++,
    game: {
      slug: title.toLowerCase().replaceAll(" ", "-"),
      title,
      coverImage: `/covers/${title}.jpg`,
      releaseDate: new Date(`${day}T00:00:00Z`),
      releaseDatePrecision: precision,
    },
  };
}

const TINT_SELECTOR = "[data-tint], [style*='--tint']";

const elements = {
  queryRegion: () => screen.queryByRole("region", { name: "Coming soon" }),
  getRegion: () => screen.getByRole("region", { name: "Coming soon" }),
  getEntries: () =>
    within(elements.getRegion())
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/games/")),
  getEntryTexts: () => elements.getEntries().map((entry) => entry.textContent),
  getEntry: (title: string) => {
    const entry = elements
      .getEntries()
      .find((link) => link.textContent.includes(title));
    if (!entry) throw new Error(`No Coming soon entry for ${title}`);
    return entry;
  },
  getSeeAllUpcoming: () =>
    within(elements.getRegion()).getByRole("link", {
      name: "See all upcoming",
    }),
  // eslint-disable-next-line testing-library/no-node-access -- CoverTint exposes only data-tint and the --tint custom properties
  queryTint: (root: HTMLElement) => root.querySelector(TINT_SELECTOR),
  querySeeAllUpcoming: () =>
    screen.queryByRole("link", { name: "See all upcoming" }),
};

describe("ComingSoon", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(THURSDAY_12_NOV_2026_NOON);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given games out today, tomorrow and in nine days", () => {
    let container: HTMLElement;

    beforeEach(() => {
      ({ container } = render(
        <ComingSoon
          candidates={[
            candidate("Nine Days Out", "2026-11-21"),
            candidate("Tomorrow Game", "2026-11-13"),
            candidate("Today Game", "2026-11-12"),
          ]}
        />
      ));
    });

    it("titles the section Coming soon", () => {
      expect(
        screen.getByRole("heading", { name: "Coming soon" })
      ).toBeVisible();
    });

    it("lists the game out today first, then the nearest dates", () => {
      expect(elements.getEntryTexts()).toEqual([
        expect.stringContaining("Today Game"),
        expect.stringContaining("Tomorrow Game"),
        expect.stringContaining("Nine Days Out"),
      ]);
    });

    it("marks today's game Out today", () => {
      expect(elements.getEntry("Today Game")).toHaveTextContent("Out today");
    });

    it("marks tomorrow's game Tomorrow", () => {
      expect(elements.getEntry("Tomorrow Game")).toHaveTextContent("Tomorrow");
    });

    it("shows the weekday and date for a game further out", () => {
      expect(elements.getEntry("Nine Days Out")).toHaveTextContent(
        "Sat 21 Nov"
      );
    });

    it("shows each game's title next to its cover", () => {
      expect(elements.getEntry("Today Game")).toHaveTextContent("Today Game");
      expect(
        within(elements.getEntry("Today Game")).getByRole("img")
      ).toBeVisible();
    });

    it("links each entry to its game page", () => {
      expect(elements.getEntry("Today Game")).toHaveAttribute(
        "href",
        "/games/today-game"
      );
      expect(elements.getEntry("Nine Days Out")).toHaveAttribute(
        "href",
        "/games/nine-days-out"
      );
    });

    it("counts no days left", () => {
      expect(elements.getRegion().textContent).not.toMatch(
        /days? left|in \d+ days?/
      );
    });

    it("shows no Moved from line", () => {
      expect(screen.queryByText("Moved from", { exact: false })).toBeNull();
    });

    it("has no cover tint", () => {
      expect(elements.queryTint(container)).toBeNull();
    });

    it("offers See all upcoming below the entries, linking to Upcoming releases", () => {
      const lastEntry = elements.getEntries().at(-1) as HTMLElement;
      expect(elements.getSeeAllUpcoming()).toHaveAttribute("href", "/upcoming");
      expect(
        lastEntry.compareDocumentPosition(elements.getSeeAllUpcoming()) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });
  });

  describe("given five games in the next thirty days, two on the same day", () => {
    beforeEach(() => {
      render(
        <ComingSoon
          candidates={[
            candidate("Fifth", "2026-12-12"),
            candidate("Zelda", "2026-11-21"),
            candidate("Fourth", "2026-12-01"),
            candidate("Alan Wake", "2026-11-21"),
            candidate("First", "2026-11-13"),
          ]}
        />
      );
    });

    it("shows the three nearest, same-day games in title order", () => {
      expect(elements.getEntryTexts()).toEqual([
        expect.stringContaining("First"),
        expect.stringContaining("Alan Wake"),
        expect.stringContaining("Zelda"),
      ]);
    });

    it("still offers See all upcoming", () => {
      expect(elements.getSeeAllUpcoming()).toHaveAttribute("href", "/upcoming");
    });
  });

  describe("given three games out today and one tomorrow", () => {
    beforeEach(() => {
      render(
        <ComingSoon
          candidates={[
            candidate("Tomorrow Game", "2026-11-13"),
            candidate("Today C", "2026-11-12"),
            candidate("Today A", "2026-11-12"),
            candidate("Today B", "2026-11-12"),
          ]}
        />
      );
    });

    it("fills the three places with the games out today", () => {
      expect(elements.getEntryTexts()).toEqual([
        expect.stringContaining("Today A"),
        expect.stringContaining("Today B"),
        expect.stringContaining("Today C"),
      ]);
    });
  });

  describe("given a game exactly thirty days from today", () => {
    beforeEach(() => {
      render(
        <ComingSoon candidates={[candidate("Day Thirty", "2026-12-12")]} />
      );
    });

    it("shows it", () => {
      expect(elements.getEntryTexts()).toEqual([
        expect.stringContaining("Day Thirty"),
      ]);
    });
  });

  describe("given only a game that is not in the window or has no exact day", () => {
    it.each<[string, Candidate[]]>([
      ["no games", []],
      [
        "a game thirty-one days from today",
        [candidate("Day Thirty One", "2026-12-13")],
      ],
      [
        "a game that came out yesterday",
        [candidate("Yesterday", "2026-11-11")],
      ],
      [
        "a game known only by its month",
        [candidate("Month Only", "2026-11-20", "MONTH")],
      ],
    ])(
      "shows no section and no empty message for %s",
      (_scenario, candidates) => {
        const { container } = render(<ComingSoon candidates={candidates} />);

        expect(container).toBeEmptyDOMElement();
      }
    );
  });

  describe("given today is 28 December and a game is out on 2 January", () => {
    beforeEach(() => {
      vi.setSystemTime(MONDAY_28_DEC_2026_NOON);
      render(
        <ComingSoon candidates={[candidate("New Year Game", "2027-01-02")]} />
      );
    });

    it("shows the weekday, the date and the new year", () => {
      expect(elements.getEntry("New Year Game")).toHaveTextContent(
        "Sat 2 Jan 2027"
      );
    });
  });
});
