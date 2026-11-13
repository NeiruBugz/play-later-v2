// @vitest-environment jsdom
/**
 * @spec: 029-release-days
 * @regression
 *
 * Functional spec 2.4, 2.5, 2.8 and the Out-of-Scope list: Home (Coming soon
 * and "Continue?"), Upcoming releases and the library cards are fed from one
 * stored library and must agree on which games are coming and when; one
 * person's games never reach another person's surfaces; no countdown wording,
 * store links or "Moved" line on Home.
 */

import { cleanup, screen, within } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { getLibrary } from "@/entities/library-item/api/get-library.server";
import { getDashboardPageDataWorker } from "@/features/dashboard/api/get-dashboard-page-data.worker";
import { addToUpNextWorker } from "@/features/up-next/api/add-to-up-next-fn.worker";
import { getUpcomingReleasesWorker } from "@/features/upcoming-releases/api/get-upcoming-releases.worker";

import { createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";
import {
  dayFromToday,
  daysBeforeNow,
  exactDay,
  freezeTimeAt,
  noDateAtAll,
  seedLibraryGame,
  toBeAnnounced,
  unfreezeTime,
  utcMidnight,
  vagueDay,
  wipeAllTables,
  type ReleaseState,
} from "./support.ts";
import {
  renderHome,
  renderLibraryCards,
  renderUpcomingReleases,
} from "./surfaces.tsx";

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

type Fixture = {
  title: string;
  release: ReleaseState;
  status?: "WANT" | "PLAYING" | "DONE";
  isOwned?: boolean;
  cardLine: string | null;
};

const MOVED_THREE_DAYS_AGO = {
  releaseDateMovedFrom: utcMidnight("2026-11-05"),
  releaseDateMovedAt: daysBeforeNow(3),
};

const ana: Fixture[] = [
  {
    title: "Alpha Today",
    release: exactDay(dayFromToday(0)),
    cardLine: "Out 12 Nov",
  },
  {
    title: "Bravo Today",
    release: exactDay(dayFromToday(0)),
    status: "DONE",
    cardLine: "Out 12 Nov",
  },
  {
    title: "Charlie Tomorrow",
    release: exactDay(dayFromToday(1)),
    isOwned: false,
    cardLine: "Out 13 Nov",
  },
  {
    title: "Delta Nine",
    release: exactDay(dayFromToday(9), MOVED_THREE_DAYS_AGO),
    status: "PLAYING",
    cardLine: "Out 21 Nov",
  },
  {
    title: "Echo Thirty",
    release: exactDay(dayFromToday(30)),
    cardLine: "Out 12 Dec",
  },
  {
    title: "Foxtrot ThirtyOne",
    release: exactDay(dayFromToday(31)),
    cardLine: "Out 13 Dec",
  },
  {
    title: "Golf March",
    release: exactDay("2027-03-14"),
    cardLine: "Out 14 Mar 2027",
  },
  {
    title: "India Month",
    release: vagueDay("2026-11-01", "MONTH"),
    cardLine: "Out Nov 2026",
  },
  {
    title: "Juliet Quarter",
    release: vagueDay("2027-04-01", "QUARTER"),
    cardLine: "Out Q2 2027",
  },
  {
    title: "Kilo Year",
    release: vagueDay("2027-01-01", "YEAR"),
    cardLine: "Out 2027",
  },
  { title: "Lima TBA", release: toBeAnnounced, cardLine: "Date TBA" },
  { title: "Mike NoDate", release: noDateAtAll, cardLine: null },
  {
    title: "November Yesterday",
    release: exactDay(dayFromToday(-1)),
    cardLine: null,
  },
  { title: "Oscar Released", release: exactDay("2020-06-02"), cardLine: null },
];

const titlesOfAnasExactUpcomingGames = [
  "Alpha Today",
  "Bravo Today",
  "Charlie Tomorrow",
  "Delta Nine",
  "Echo Thirty",
  "Foxtrot ThirtyOne",
  "Golf March",
];

const titlesAnaNeverSeesOnUpcomingReleases = ana
  .map(({ title }) => title)
  .filter((title) => !titlesOfAnasExactUpcomingGames.includes(title));

const BEN_ONLY_GAME = "Bobs Secret";

const elements = {
  getComingSoonEntries: () => {
    const comingSoon = screen.queryByRole("region", { name: "Coming soon" });
    return comingSoon ? within(comingSoon).getAllByRole("listitem") : [];
  },
  getSeeAllUpcomingLink: () =>
    screen.queryByRole("link", { name: "See all upcoming" }),
  getUpcomingEntries: () =>
    screen.queryAllByRole("listitem").map((entry) => entry.textContent ?? ""),
  getTitlesUnderMonthHeading: (heading: string) => {
    const month = screen.queryByRole("region", { name: heading });
    return month
      ? within(month)
          .getAllByRole("listitem")
          .map(
            (entry) =>
              titlesOfAnasExactUpcomingGames.find((title) =>
                entry.textContent?.includes(title)
              ) ?? ""
          )
      : [];
  },
  getCardReleaseLine: (title: string) =>
    within(screen.getByLabelText(`${title} on grid`)).queryByTestId(
      "game-card-release"
    ),
  getCardMovedLine: (title: string) =>
    within(screen.getByLabelText(`${title} on grid`)).queryByTestId(
      "game-card-moved"
    ),
  getContinueHeading: () =>
    screen.queryByRole("heading", { level: 2, name: /\?$|too\.$/ }),
  getFirstOnUpNextShelf: () =>
    screen.queryByRole("link", { current: true })?.textContent ?? null,
  getEveryLinkTarget: () =>
    screen
      .queryAllByRole("link")
      .map((link) => link.getAttribute("href") ?? ""),
  getPageText: () => document.body.textContent ?? "",
};

const countdownWording = ["days left", "day left", "days away", "countdown"];

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("spec-029-surfaces-agree");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  freezeTimeAt();
  await wipeAllTables(db);
});

afterEach(() => {
  cleanup();
  unfreezeTime();
});

const actions = {
  seedLibrary: async (userId: string, fixtures: Fixture[]) => {
    for (const { title, release, status, isOwned } of fixtures) {
      await seedLibraryGame(db.prisma, userId, {
        title,
        release,
        status,
        isOwned,
      });
    }
  },
  openHome: async (userId: string) => {
    cleanup();
    renderHome(await getDashboardPageDataWorker(userId));
  },
  openUpcomingReleases: async (userId: string) => {
    cleanup();
    renderUpcomingReleases(await getUpcomingReleasesWorker(userId));
  },
  openLibrary: async (userId: string) => {
    cleanup();
    const { items } = await getLibrary(userId, {});
    renderLibraryCards(items);
  },
};

describe("Home, Upcoming releases and the library agree", () => {
  let anaId: string;
  let benId: string;

  beforeEach(async () => {
    anaId = (await createUser(db.prisma)).id;
    benId = (await createUser(db.prisma)).id;
    await actions.seedLibrary(anaId, ana);
    await actions.seedLibrary(benId, [
      {
        title: BEN_ONLY_GAME,
        release: exactDay(dayFromToday(0)),
        cardLine: "Out 12 Nov",
      },
    ]);
  });

  describe("when Ana opens Home", () => {
    beforeEach(async () => {
      await actions.openHome(anaId);
    });

    it("shows the three nearest exact-date games, same-day games in title order", () => {
      expect(
        elements.getComingSoonEntries().map((entry) => entry.textContent)
      ).toEqual([
        "Alpha TodayOut today",
        "Bravo TodayOut today",
        "Charlie TomorrowTomorrow",
      ]);
    });

    it("offers See all upcoming, which opens Upcoming releases", () => {
      expect(elements.getSeeAllUpcomingLink()).toHaveAttribute(
        "href",
        "/upcoming"
      );
    });

    it("leaves out games beyond the three, vaguer dates, TBA and yesterday", () => {
      for (const title of [
        "Delta Nine",
        "India Month",
        "Juliet Quarter",
        "Kilo Year",
        "Lima TBA",
        "November Yesterday",
      ]) {
        expect(
          within(
            screen.getByRole("region", { name: "Coming soon" })
          ).queryByText(title)
        ).toBeNull();
      }
    });

    it("shows no one else's game", () => {
      expect(elements.getPageText()).not.toContain(BEN_ONLY_GAME);
    });
  });

  describe("when Ana opens Upcoming releases", () => {
    beforeEach(async () => {
      await actions.openUpcomingReleases(anaId);
    });

    it("lists every exact-date upcoming game in date order, same-day games in title order", () => {
      expect(
        elements
          .getUpcomingEntries()
          .map((entry) =>
            titlesOfAnasExactUpcomingGames.find((title) =>
              entry.includes(title)
            )
          )
      ).toEqual(titlesOfAnasExactUpcomingGames);
    });

    it.each([
      {
        heading: "November 2026",
        titles: [
          "Alpha Today",
          "Bravo Today",
          "Charlie Tomorrow",
          "Delta Nine",
        ],
      },
      {
        heading: "December 2026",
        titles: ["Echo Thirty", "Foxtrot ThirtyOne"],
      },
      { heading: "March 2027", titles: ["Golf March"] },
    ])("groups $titles under $heading", ({ heading, titles }) => {
      expect(elements.getTitlesUnderMonthHeading(heading)).toEqual(titles);
    });

    it("writes Out today in place of the weekday for both of today's games", () => {
      const entries = elements.getUpcomingEntries();
      expect(entries[0]).toContain("Out today");
      expect(entries[1]).toContain("Out today");
    });

    it("leaves out vaguer dates, TBA, no date, yesterday and released games", () => {
      for (const title of titlesAnaNeverSeesOnUpcomingReleases) {
        expect(screen.queryByText(title)).toBeNull();
      }
    });

    it("shows no one else's game", () => {
      expect(elements.getPageText()).not.toContain(BEN_ONLY_GAME);
    });
  });

  describe("when Ana opens the library", () => {
    beforeEach(async () => {
      await actions.openLibrary(anaId);
    });

    it.each(
      ana
        .filter(({ cardLine }) => cardLine !== null)
        .map(({ title, cardLine }) => ({ title, cardLine: cardLine! }))
    )("shows $cardLine on the card of $title", ({ title, cardLine }) => {
      expect(elements.getCardReleaseLine(title)).toHaveTextContent(cardLine);
    });

    it.each(
      ana
        .filter(({ cardLine }) => cardLine === null)
        .map(({ title }) => ({ title }))
    )("shows no release line on the card of $title", ({ title }) => {
      expect(elements.getCardReleaseLine(title)).toBeNull();
    });

    it("shows the Moved line of the moved game on its card", () => {
      expect(elements.getCardMovedLine("Delta Nine")).toHaveTextContent(
        "Moved from 5 Nov"
      );
    });

    it("shows no one else's game", () => {
      expect(elements.getPageText()).not.toContain(BEN_ONLY_GAME);
    });
  });

  describe("when Ben opens Home and Upcoming releases", () => {
    it("sees only his own game on Home", async () => {
      await actions.openHome(benId);
      expect(
        elements.getComingSoonEntries().map((entry) => entry.textContent)
      ).toEqual([`${BEN_ONLY_GAME}Out today`]);
    });

    it("sees only his own game on Upcoming releases", async () => {
      await actions.openUpcomingReleases(benId);
      expect(elements.getUpcomingEntries()).toHaveLength(1);
      expect(elements.getPageText()).not.toContain("Alpha Today");
    });
  });

  describe.each([
    { surface: "Home", open: actions.openHome },
    { surface: "Upcoming releases", open: actions.openUpcomingReleases },
    { surface: "the library", open: actions.openLibrary },
  ])("when Ana opens $surface", ({ open }) => {
    beforeEach(async () => {
      await open(anaId);
    });

    it("shows no countdown or days-left wording", () => {
      const pageText = elements.getPageText().toLowerCase();
      for (const wording of countdownWording) {
        expect(pageText).not.toContain(wording);
      }
      expect(pageText).not.toMatch(/\bin \d+ days?\b/);
    });

    it("links only inside the app, with no store or buying links", () => {
      for (const target of elements.getEveryLinkTarget()) {
        expect(target.startsWith("/")).toBe(true);
        expect(target.toLowerCase()).not.toMatch(/store|steam|buy|shop/);
      }
    });

    it("shows no Delayed badge", () => {
      expect(elements.getPageText()).not.toContain("Delayed");
    });
  });

  describe("when Ana opens Home while a game has a recent Moved marker", () => {
    beforeEach(async () => {
      await actions.openHome(anaId);
    });

    it("shows no Moved line on Home", () => {
      expect(elements.getPageText()).not.toContain("Moved");
    });
  });

  describe("when Ana opens Upcoming releases while a game has a recent Moved marker", () => {
    beforeEach(async () => {
      await actions.openUpcomingReleases(anaId);
    });

    it("shows the Moved line on that game's entry only", () => {
      const entriesWithMoved = elements
        .getUpcomingEntries()
        .filter((entry) => entry.includes("Moved from"));
      expect(entriesWithMoved).toHaveLength(1);
      expect(entriesWithMoved[0]).toContain("Delta Nine");
      expect(entriesWithMoved[0]).toContain("Moved from 5 Nov");
    });
  });
});

describe("the edges of the Coming soon window", () => {
  describe.each([
    { daysAhead: 30, shownOnHome: true },
    { daysAhead: 31, shownOnHome: false },
  ])(
    "given the only upcoming game is $daysAhead days ahead",
    ({ daysAhead, shownOnHome }) => {
      let personId: string;

      beforeEach(async () => {
        personId = (await createUser(db.prisma)).id;
        await actions.seedLibrary(personId, [
          {
            title: "Edge Case",
            release: exactDay(dayFromToday(daysAhead)),
            cardLine: null,
          },
        ]);
      });

      describe("when the person opens Home", () => {
        beforeEach(async () => {
          await actions.openHome(personId);
        });

        it(`${shownOnHome ? "shows" : "does not show"} a Coming soon section`, () => {
          expect(screen.queryByText("Coming soon") !== null).toBe(shownOnHome);
        });

        it(`${shownOnHome ? "offers" : "hides"} the See all upcoming link`, () => {
          expect(elements.getSeeAllUpcomingLink() !== null).toBe(shownOnHome);
        });
      });

      describe("when the person opens Upcoming releases", () => {
        beforeEach(async () => {
          await actions.openUpcomingReleases(personId);
        });

        it("lists the game either way", () => {
          expect(screen.getByText("Edge Case")).toBeVisible();
        });
      });
    }
  );

  describe("given today is 28 December and a game comes out on 2 January", () => {
    let personId: string;

    beforeEach(async () => {
      freezeTimeAt(new Date("2026-12-28T12:00:00Z"));
      personId = (await createUser(db.prisma)).id;
      await actions.seedLibrary(personId, [
        {
          title: "New Year",
          release: exactDay("2027-01-02"),
          cardLine: null,
        },
      ]);
      await actions.openHome(personId);
    });

    it("shows the weekday, the day and the new year on Home", () => {
      expect(elements.getComingSoonEntries()[0]).toHaveTextContent(
        "Sat 2 Jan 2027"
      );
    });
  });

  describe("given nobody has any upcoming game", () => {
    beforeEach(async () => {
      const personId = (await createUser(db.prisma)).id;
      await actions.seedLibrary(personId, [
        {
          title: "Old Favourite",
          release: exactDay("2019-05-01"),
          cardLine: null,
        },
      ]);
      await actions.openUpcomingReleases(personId);
    });

    it("explains that games appear once their release day is announced", () => {
      expect(
        screen.getByText(
          "No upcoming releases with a set date. Games appear here once their release day is announced."
        )
      ).toBeVisible();
    });
  });
});

describe('"Continue?" skips games that are not out yet', () => {
  type QueueScenario = {
    given: string;
    queue: Array<{ title: string; release: ReleaseState }>;
    continueHeading: string;
    shelfLeadsWith: string;
  };

  const upcomingQuarter = vagueDay("2027-04-01", "QUARTER");

  describe.each<QueueScenario>([
    {
      given: "an upcoming game first and a released game second",
      queue: [
        { title: "Not Yet", release: upcomingQuarter },
        { title: "Out Already", release: exactDay("2020-06-02") },
      ],
      continueHeading: "Start Out Already?",
      shelfLeadsWith: "Not Yet",
    },
    {
      given: "a TBA game first and a game with no date second",
      queue: [
        { title: "Someday", release: toBeAnnounced },
        { title: "Undated", release: noDateAtAll },
      ],
      continueHeading: "Start Undated?",
      shelfLeadsWith: "Someday",
    },
    {
      given: "only upcoming games",
      queue: [
        { title: "Not Yet", release: upcomingQuarter },
        { title: "Someday", release: toBeAnnounced },
      ],
      continueHeading: "Nothing tonight is fine too.",
      shelfLeadsWith: "Not Yet",
    },
    {
      given: "a game that came out yesterday first",
      queue: [
        { title: "Just Out", release: exactDay(dayFromToday(-1)) },
        { title: "Not Yet", release: upcomingQuarter },
      ],
      continueHeading: "Start Just Out?",
      shelfLeadsWith: "Just Out",
    },
  ])("given nothing is Playing and Up Next holds $given", (scenario) => {
    beforeEach(async () => {
      const personId = (await createUser(db.prisma)).id;
      for (const { title, release } of scenario.queue) {
        const { item } = await seedLibraryGame(db.prisma, personId, {
          title,
          release,
        });
        await addToUpNextWorker(personId, { id: item.id });
      }
      await actions.openHome(personId);
    });

    it("lets the Continue? panel say what it should", () => {
      expect(elements.getContinueHeading()).toHaveTextContent(
        scenario.continueHeading
      );
    });

    it("keeps the Up Next shelf in queue order", () => {
      expect(elements.getFirstOnUpNextShelf()).toContain(
        scenario.shelfLeadsWith
      );
    });
  });
});
