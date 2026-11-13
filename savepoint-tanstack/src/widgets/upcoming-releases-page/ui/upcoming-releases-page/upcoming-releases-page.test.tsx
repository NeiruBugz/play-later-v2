import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UpcomingRelease } from "@/entities/library-item/api/get-upcoming-releases.server";

import { UpcomingReleasesPage } from "./upcoming-releases-page";

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<object>("@tanstack/react-router")),
  Link: ({
    to,
    params,
    children,
    ...rest
  }: {
    to: string;
    params?: Record<string, string>;
    children: ReactNode;
  }) => (
    <a
      href={Object.entries(params ?? {}).reduce(
        (path, [name, value]) => path.replace(`$${name}`, value),
        to
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

const EMPTY_COPY =
  "No upcoming releases with a set date. Games appear here once their release day is announced.";

const midnightUtc = (day: string) => new Date(`${day}T00:00:00.000Z`);

let nextId = 0;

function upcoming(
  title: string,
  day: string,
  options: {
    status?: UpcomingRelease["status"];
    isOwned?: boolean;
    movedFrom?: string;
    movedAt?: string;
  } = {}
): UpcomingRelease {
  nextId += 1;
  return {
    id: nextId,
    status: options.status ?? "WANT",
    isOwned: options.isOwned ?? true,
    game: {
      slug: title.toLowerCase().replaceAll(" ", "-"),
      title,
      coverImage: "co1abc",
      releaseDate: midnightUtc(day),
      releaseDatePrecision: "DAY",
      releaseDateMovedFrom: options.movedFrom
        ? midnightUtc(options.movedFrom)
        : null,
      releaseDateMovedAt: options.movedAt ? new Date(options.movedAt) : null,
    },
  };
}

const hades = upcoming("Hades III", "2026-11-12", { status: "PLAYING" });
const alanWake = upcoming("Alan Wake 3", "2026-11-12");
const cameOutYesterday = upcoming("Came out yesterday", "2026-11-11", {
  status: "DONE",
});
const signalis = upcoming("Signalis 2", "2026-12-04", { isOwned: false });
const tunic = upcoming("Tunic 2", "2027-03-12", {
  status: "DONE",
  isOwned: false,
  movedFrom: "2026-12-04",
  movedAt: "2026-11-05T10:00:00.000Z",
});
const celeste = upcoming("Celeste 2", "2027-04-02", {
  movedFrom: "2026-12-01",
  movedAt: "2026-10-23T10:00:00.000Z",
});
const hollow = upcoming("Hollow Knight 3", "2028-01-14", { status: "PLAYING" });

const ALL_TITLES = [
  hades,
  alanWake,
  cameOutYesterday,
  signalis,
  tunic,
  celeste,
  hollow,
].map(({ game }) => game.title);

const elements = {
  getPageTitle: () =>
    screen.getByRole("heading", { level: 1, name: "Upcoming releases" }),
  getMonthHeadings: () =>
    screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent),
  queryMonthSection: (heading: string) =>
    screen.queryByRole("region", { name: heading }),
  getMonthSection: (heading: string) =>
    screen.getByRole("region", { name: heading }),
  getRowTitlesInMonth: (heading: string) =>
    within(elements.getMonthSection(heading))
      .getAllByRole("listitem")
      .map((row) => {
        const title = ALL_TITLES.find(
          (candidate) => within(row).queryByText(candidate) !== null
        );
        if (!title) throw new Error("A row shows none of the known titles");
        return title;
      }),
  getRow: (title: string) => {
    const row = screen
      .getAllByRole("listitem")
      .find((candidate) => within(candidate).queryByText(title) !== null);
    if (!row) throw new Error(`No list row for "${title}"`);
    return row;
  },
  getRowLink: (title: string) =>
    within(elements.getRow(title)).getByRole("link"),
  getAllRowLinks: () =>
    screen.getAllByRole("listitem").map((row) => within(row).getByRole("link")),
};

const actions = {
  setDeviceClock: (now: Date) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
  },
};

describe(UpcomingReleasesPage, () => {
  beforeEach(() => {
    actions.setDeviceClock(new Date(2026, 10, 12, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given games out today, in December, in March, in April and in the following January", () => {
    beforeEach(() => {
      render(
        <UpcomingReleasesPage
          entries={[hades, alanWake, signalis, tunic, celeste, hollow]}
        />
      );
    });

    it("titles the page Upcoming releases", () => {
      expect(elements.getPageTitle()).toBeInTheDocument();
    });

    it("gives each month its own heading, in date order", () => {
      expect(elements.getMonthHeadings()).toEqual([
        "November 2026",
        "December 2026",
        "March 2027",
        "April 2027",
        "January 2028",
      ]);
    });

    it("lists each game under its own month", () => {
      expect([
        elements.getRowTitlesInMonth("November 2026"),
        elements.getRowTitlesInMonth("December 2026"),
        elements.getRowTitlesInMonth("March 2027"),
        elements.getRowTitlesInMonth("April 2027"),
        elements.getRowTitlesInMonth("January 2028"),
      ]).toEqual([
        expect.arrayContaining(["Hades III", "Alan Wake 3"]),
        ["Signalis 2"],
        ["Tunic 2"],
        ["Celeste 2"],
        ["Hollow Knight 3"],
      ]);
    });

    it("shows the short weekday and day for a game that is not out today", () => {
      expect(
        within(elements.getRow("Signalis 2")).getByText("Fri 4")
      ).toBeInTheDocument();
    });

    it("shows the weekday and day for a game in a following year", () => {
      expect(
        within(elements.getRow("Hollow Knight 3")).getByText("Fri 14")
      ).toBeInTheDocument();
    });

    it("shows Out today instead of a weekday and day for each game out today", () => {
      expect(
        [hades, alanWake].map(
          ({ game }) =>
            within(elements.getRow(game.title)).queryByText("Out today") !==
            null
        )
      ).toEqual([true, true]);
    });

    it("never shows today's weekday and day for a game out today", () => {
      expect(screen.queryByText("Thu 12")).toBeNull();
    });

    it("shows Out today only for the games out today", () => {
      expect(screen.getAllByText("Out today")).toHaveLength(2);
    });

    it("shows each game's cover", () => {
      expect(
        within(elements.getRow("Signalis 2")).getByRole("img")
      ).toHaveAttribute("src", "https://images.igdb.com/cover.jpg");
    });

    it("links each row to its game page", () => {
      expect(
        elements.getAllRowLinks().map((link) => link.getAttribute("href"))
      ).toEqual([
        "/games/hades-iii",
        "/games/alan-wake-3",
        "/games/signalis-2",
        "/games/tunic-2",
        "/games/celeste-2",
        "/games/hollow-knight-3",
      ]);
    });

    it("shows each game's status", () => {
      expect(
        [
          ["Hades III", "Playing"],
          ["Alan Wake 3", "Want"],
          ["Tunic 2", "Done"],
          ["Hollow Knight 3", "Playing"],
        ].map(
          ([title, status]) =>
            within(elements.getRow(title)).queryByText(status) !== null
        )
      ).toEqual([true, true, true, true]);
    });

    it("tags a Want game the person does not own as Not owned", () => {
      expect(
        within(elements.getRow("Signalis 2")).getByText("Not owned")
      ).toBeInTheDocument();
    });

    it("shows no Not owned tag on a Want game the person owns", () => {
      expect(
        within(elements.getRow("Alan Wake 3")).queryByText("Not owned")
      ).toBeNull();
    });

    it("shows no Not owned tag on a Done game, owned or not", () => {
      expect(
        within(elements.getRow("Tunic 2")).queryByText("Not owned")
      ).toBeNull();
    });

    it("shows the moved line within 14 days of the move", () => {
      expect(
        within(elements.getRow("Tunic 2")).getByText("Moved from 4 Dec")
      ).toBeInTheDocument();
    });

    it("shows no moved line once the 14 days have passed", () => {
      expect(screen.queryByText("Moved from 1 Dec")).toBeNull();
    });

    it("shows no moved line on a game that never moved", () => {
      expect(
        within(elements.getRow("Signalis 2")).queryByText("Moved from", {
          exact: false,
        })
      ).toBeNull();
    });

    it("shows no empty message", () => {
      expect(screen.queryByText(EMPTY_COPY)).toBeNull();
    });
  });

  describe("given two games out today in the order the query gave them", () => {
    beforeEach(() => {
      render(<UpcomingReleasesPage entries={[hades, alanWake, signalis]} />);
    });

    it("lists them first, in that order", () => {
      expect(elements.getRowTitlesInMonth("November 2026")).toEqual([
        "Hades III",
        "Alan Wake 3",
      ]);
    });
  });

  describe("given a game that came out yesterday on the device clock", () => {
    beforeEach(() => {
      render(<UpcomingReleasesPage entries={[cameOutYesterday, signalis]} />);
    });

    it("does not list it", () => {
      expect(screen.queryByText("Came out yesterday")).toBeNull();
    });

    it("does not keep a heading for the month that has nothing left", () => {
      expect(elements.queryMonthSection("November 2026")).toBeNull();
    });

    it("still lists the games ahead", () => {
      expect(screen.getByText("Signalis 2")).toBeInTheDocument();
    });
  });

  describe("given the device clock has moved on to 13 Nov", () => {
    beforeEach(() => {
      actions.setDeviceClock(new Date(2026, 10, 13, 12));
      render(<UpcomingReleasesPage entries={[hades, alanWake, signalis]} />);
    });

    it("no longer lists the games that came out on 12 Nov", () => {
      expect(elements.getMonthHeadings()).toEqual(["December 2026"]);
    });

    it("shows no Out today", () => {
      expect(screen.queryByText("Out today")).toBeNull();
    });
  });

  describe("given no entries", () => {
    beforeEach(() => {
      render(<UpcomingReleasesPage entries={[]} />);
    });

    it("still titles the page", () => {
      expect(elements.getPageTitle()).toBeInTheDocument();
    });

    it("says nothing is coming and when games appear", () => {
      expect(screen.getByText(EMPTY_COPY)).toBeInTheDocument();
    });

    it("shows no month heading", () => {
      expect(screen.queryAllByRole("heading", { level: 2 })).toEqual([]);
    });
  });

  describe("given only games that came out before today", () => {
    beforeEach(() => {
      render(<UpcomingReleasesPage entries={[cameOutYesterday]} />);
    });

    it("says nothing is coming", () => {
      expect(screen.getByText(EMPTY_COPY)).toBeInTheDocument();
    });
  });

  describe("given a phone-width single column", () => {
    let link: HTMLElement;

    beforeEach(() => {
      render(<UpcomingReleasesPage entries={[hades, signalis]} />);
      link = elements.getRowLink("Signalis 2");
    });

    it("gives each row a tap target at least min-h-14 tall", () => {
      const minHeight = [...link.classList]
        .map((name) => /^min-h-(\d+)$/.exec(name))
        .find((match) => match !== null);
      expect(Number(minHeight?.[1])).toBeGreaterThanOrEqual(14);
    });

    it("never asks the page to scroll sideways", () => {
      expect(document.body.innerHTML).not.toMatch(
        /class="[^"]*\boverflow(-x)?-(auto|scroll)\b/
      );
    });
  });
});
