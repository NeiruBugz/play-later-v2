// @vitest-environment jsdom
/**
 * @spec: 029-release-days
 * @regression
 *
 * Functional spec 2.6, 2.7 (with 2.5 AC3): opening Home or the library checks
 * the catalogue, and the correction then shows on every surface that carries a
 * date. IGDB is mocked at its fetch seam; the database and every rendered
 * surface are real.
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
import { refreshReleaseDatesWorker } from "@/features/release-dates/api/refresh-release-dates.worker";
import { getUpcomingReleasesWorker } from "@/features/upcoming-releases/api/get-upcoming-releases.worker";

import { createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";
import {
  daysBeforeNow,
  exactDay,
  freezeTimeAt,
  igdbAnswers,
  igdbFetchMock,
  igdbIdsAskedAbout,
  igdbReportsExactDay,
  igdbReportsToBeAnnounced,
  igdbReportsYear,
  NOW,
  seedLibraryGame,
  unfreezeTime,
  utcMidnight,
  vagueDay,
  wipeAllTables,
} from "./support.ts";
import {
  renderGamePageAbout,
  renderHome,
  renderLibraryCards,
  renderUpcomingReleases,
} from "./surfaces.tsx";

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const GAME_TITLE = "Netherwake";
const GAME_IGDB_ID = 349_703;
const THREE_DAYS_AGO = daysBeforeNow(3);
const MILLISECONDS_PER_DAY = 86_400_000;
const MONTH_HEADINGS = ["November 2026", "December 2026", "March 2027"];

const elements = {
  getReleaseLineOnCard: () =>
    within(screen.getByLabelText(`${GAME_TITLE} on grid`)).queryByTestId(
      "game-card-release"
    ),
  getMovedLineOnCard: () =>
    within(screen.getByLabelText(`${GAME_TITLE} on grid`)).queryByTestId(
      "game-card-moved"
    ),
  getReleaseFactOnGamePage: () => {
    const terms = screen.queryAllByRole("term");
    const releaseIndex = terms.findIndex((term) =>
      term.textContent?.startsWith("Releas")
    );
    if (releaseIndex === -1) return null;
    const value = screen.queryAllByRole("definition")[releaseIndex];
    return `${terms[releaseIndex]!.textContent} ${value?.textContent}`;
  },
  getUpcomingEntry: () =>
    screen
      .queryAllByRole("listitem")
      .find((entry) => entry.textContent?.includes(GAME_TITLE)) ?? null,
  getMonthHeadingOfUpcomingEntry: () =>
    MONTH_HEADINGS.find((heading) => {
      const month = screen.queryByRole("region", { name: heading });
      return month !== null && within(month).queryByText(GAME_TITLE) !== null;
    }) ?? null,
  getComingSoonEntry: () => {
    const comingSoon = screen.queryByRole("region", { name: "Coming soon" });
    return comingSoon
      ? (within(comingSoon)
          .queryAllByRole("listitem")
          .find((entry) => entry.textContent?.includes(GAME_TITLE)) ?? null)
      : null;
  },
};

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("spec-029-dates-current");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  freezeTimeAt();
  igdbFetchMock.mockReset();
  await wipeAllTables(db);
});

afterEach(() => {
  cleanup();
  unfreezeTime();
});

const actions = {
  openHomeOrLibrary: (userId: string) => refreshReleaseDatesWorker(userId),
  readLibrary: async (userId: string) => {
    const { items } = await getLibrary(userId, {});
    cleanup();
    renderLibraryCards(items);
    return items;
  },
  readGamePage: async (userId: string) => {
    const { items } = await getLibrary(userId, {});
    cleanup();
    renderGamePageAbout(items[0]!.game);
  },
  readUpcomingReleases: async (userId: string) => {
    cleanup();
    renderUpcomingReleases(await getUpcomingReleasesWorker(userId));
  },
  readHome: async (userId: string) => {
    cleanup();
    renderHome(await getDashboardPageDataWorker(userId));
  },
};

async function seedPerson() {
  return (await createUser(db.prisma)).id;
}

describe("dates stay current", () => {
  describe("given an upcoming game whose exact date moved in the catalogue, owned by two people", () => {
    let firstPersonId: string;
    let secondPersonId: string;

    beforeEach(async () => {
      firstPersonId = await seedPerson();
      secondPersonId = await seedPerson();
      const { game } = await seedLibraryGame(db.prisma, firstPersonId, {
        title: GAME_TITLE,
        igdbId: GAME_IGDB_ID,
        release: exactDay("2026-11-20", {
          releaseDateCheckedAt: THREE_DAYS_AGO,
        }),
      });
      await db.prisma.libraryItem.create({
        data: { userId: secondPersonId, gameId: game.id, status: "WANT" },
      });
      igdbAnswers({
        [GAME_IGDB_ID]: igdbReportsExactDay(GAME_IGDB_ID, "2026-11-13"),
      });
      await actions.openHomeOrLibrary(firstPersonId);
    });

    describe("when the first person opens the library again", () => {
      beforeEach(async () => {
        await actions.readLibrary(firstPersonId);
      });

      it("shows the new date on the card", () => {
        expect(elements.getReleaseLineOnCard()).toHaveTextContent("Out 13 Nov");
      });

      it("shows the old date in the quiet Moved line", () => {
        expect(elements.getMovedLineOnCard()).toHaveTextContent(
          "Moved from 20 Nov"
        );
      });
    });

    describe("when the first person opens the game page", () => {
      beforeEach(async () => {
        await actions.readGamePage(firstPersonId);
      });

      it("shows the new date with the year", () => {
        expect(elements.getReleaseFactOnGamePage()).toBe(
          "Releases 13 Nov 2026"
        );
      });

      it("shows no Moved line", () => {
        expect(document.body).not.toHaveTextContent("Moved");
      });
    });

    describe("when the first person opens Upcoming releases", () => {
      beforeEach(async () => {
        await actions.readUpcomingReleases(firstPersonId);
      });

      it("lists the game on the new date under November", () => {
        expect(elements.getMonthHeadingOfUpcomingEntry()).toBe("November 2026");
        expect(elements.getUpcomingEntry()).toHaveTextContent("Fri 13");
      });

      it("shows the Moved line on the entry", () => {
        expect(elements.getUpcomingEntry()).toHaveTextContent(
          "Moved from 20 Nov"
        );
      });
    });

    describe("when the first person opens Home", () => {
      beforeEach(async () => {
        await actions.readHome(firstPersonId);
      });

      it("shows the game in Coming soon as Tomorrow", () => {
        expect(elements.getComingSoonEntry()).toHaveTextContent("Tomorrow");
      });

      it("shows no Moved line", () => {
        expect(document.body).not.toHaveTextContent("Moved");
      });
    });

    describe("when the second person, who has not opened anything since, opens the library", () => {
      beforeEach(async () => {
        await actions.readLibrary(secondPersonId);
      });

      it("sees the same correction and the same Moved line", () => {
        expect(elements.getReleaseLineOnCard()).toHaveTextContent("Out 13 Nov");
        expect(elements.getMovedLineOnCard()).toHaveTextContent(
          "Moved from 20 Nov"
        );
      });
    });

    describe("when the second person's visit then checks the catalogue", () => {
      beforeEach(async () => {
        await actions.openHomeOrLibrary(secondPersonId);
        await actions.readLibrary(secondPersonId);
      });

      it("does not ask the catalogue about the game a second time", () => {
        expect(igdbIdsAskedAbout()).toEqual([GAME_IGDB_ID]);
      });

      it("keeps the move recorded once, from the original date", () => {
        expect(elements.getMovedLineOnCard()).toHaveTextContent(
          "Moved from 20 Nov"
        );
      });
    });

    describe("when the catalogue moves the date again a day later", () => {
      beforeEach(async () => {
        freezeTimeAt(new Date(NOW.getTime() + MILLISECONDS_PER_DAY));
        igdbAnswers({
          [GAME_IGDB_ID]: igdbReportsExactDay(GAME_IGDB_ID, "2026-12-05"),
        });
        await actions.openHomeOrLibrary(firstPersonId);
        await actions.readLibrary(firstPersonId);
      });

      it("shows the most recent old date", () => {
        expect(elements.getReleaseLineOnCard()).toHaveTextContent("Out 5 Dec");
        expect(elements.getMovedLineOnCard()).toHaveTextContent(
          "Moved from 13 Nov"
        );
      });
    });
  });

  describe("given a game known only as 2027 whose exact date was announced a while ago", () => {
    let personId: string;

    beforeEach(async () => {
      personId = await seedPerson();
      await seedLibraryGame(db.prisma, personId, {
        title: GAME_TITLE,
        igdbId: GAME_IGDB_ID,
        release: vagueDay("2027-01-01", "YEAR", {
          releaseDateCheckedAt: daysBeforeNow(9),
        }),
      });
      igdbAnswers({
        [GAME_IGDB_ID]: igdbReportsExactDay(GAME_IGDB_ID, "2027-03-14"),
      });
    });

    describe("when the person opens Upcoming releases before the check", () => {
      beforeEach(async () => {
        await actions.readUpcomingReleases(personId);
      });

      it("does not list the game", () => {
        expect(elements.getUpcomingEntry()).toBeNull();
      });
    });

    describe("when the person opens the library and then opens it again", () => {
      beforeEach(async () => {
        await actions.openHomeOrLibrary(personId);
        await actions.readLibrary(personId);
      });

      it("shows the exact date on the card", () => {
        expect(elements.getReleaseLineOnCard()).toHaveTextContent(
          "Out 14 Mar 2027"
        );
      });

      it("shows no Moved line, because an announcement is not a move", () => {
        expect(elements.getMovedLineOnCard()).toBeNull();
      });
    });

    describe("when the person then opens Upcoming releases", () => {
      beforeEach(async () => {
        await actions.openHomeOrLibrary(personId);
        await actions.readUpcomingReleases(personId);
      });

      it("lists the game under March 2027", () => {
        expect(elements.getMonthHeadingOfUpcomingEntry()).toBe("March 2027");
      });
    });
  });

  describe.each([
    {
      given: "an exact date the catalogue now reports as the year 2027",
      catalogue: igdbReportsYear(GAME_IGDB_ID, 2027),
      cardLine: "Out 2027",
    },
    {
      given: "an exact date the catalogue now reports as TBA",
      catalogue: igdbReportsToBeAnnounced(GAME_IGDB_ID),
      cardLine: "Date TBA",
    },
  ])("given $given", ({ catalogue, cardLine }) => {
    let personId: string;

    beforeEach(async () => {
      personId = await seedPerson();
      await seedLibraryGame(db.prisma, personId, {
        title: GAME_TITLE,
        igdbId: GAME_IGDB_ID,
        release: exactDay("2026-11-25", {
          releaseDateCheckedAt: THREE_DAYS_AGO,
        }),
      });
      igdbAnswers({ [GAME_IGDB_ID]: catalogue });
      await actions.openHomeOrLibrary(personId);
    });

    describe("when the person opens the library again", () => {
      beforeEach(async () => {
        await actions.readLibrary(personId);
      });

      it("shows the vaguer label on the card", () => {
        expect(elements.getReleaseLineOnCard()).toHaveTextContent(cardLine);
      });

      it("shows the old exact date as Moved from", () => {
        expect(elements.getMovedLineOnCard()).toHaveTextContent(
          "Moved from 25 Nov"
        );
      });
    });

    describe("when the person opens Upcoming releases", () => {
      beforeEach(async () => {
        await actions.readUpcomingReleases(personId);
      });

      it("no longer lists the game", () => {
        expect(elements.getUpcomingEntry()).toBeNull();
      });
    });
  });

  describe("given a game that came out earlier than its stored date", () => {
    let personId: string;

    beforeEach(async () => {
      personId = await seedPerson();
      await seedLibraryGame(db.prisma, personId, {
        title: GAME_TITLE,
        igdbId: GAME_IGDB_ID,
        release: exactDay("2026-11-20", {
          releaseDateCheckedAt: THREE_DAYS_AGO,
        }),
      });
      igdbAnswers({
        [GAME_IGDB_ID]: igdbReportsExactDay(GAME_IGDB_ID, "2026-11-10"),
      });
      await actions.openHomeOrLibrary(personId);
      await actions.readLibrary(personId);
    });

    it("counts as released: no release line and no Moved line", () => {
      expect(elements.getReleaseLineOnCard()).toBeNull();
      expect(elements.getMovedLineOnCard()).toBeNull();
    });
  });

  describe("given a game released last month whose catalogue date later changes", () => {
    let personId: string;

    beforeEach(async () => {
      personId = await seedPerson();
      await seedLibraryGame(db.prisma, personId, {
        title: GAME_TITLE,
        igdbId: GAME_IGDB_ID,
        release: exactDay("2026-10-12", {
          releaseDateCheckedAt: daysBeforeNow(40),
        }),
      });
      igdbAnswers({
        [GAME_IGDB_ID]: igdbReportsExactDay(GAME_IGDB_ID, "2026-12-01"),
      });
      await actions.openHomeOrLibrary(personId);
    });

    it("never asks the catalogue about it", () => {
      expect(igdbIdsAskedAbout()).toEqual([]);
    });

    describe("when the person opens the library", () => {
      beforeEach(async () => {
        await actions.readLibrary(personId);
      });

      it("shows no release date line on the card", () => {
        expect(elements.getReleaseLineOnCard()).toBeNull();
      });
    });

    describe("when the person opens the game page", () => {
      beforeEach(async () => {
        await actions.readGamePage(personId);
      });

      it("still shows its original Released date", () => {
        expect(elements.getReleaseFactOnGamePage()).toBe(
          "Released 12 Oct 2026"
        );
      });
    });
  });

  describe("given the catalogue is unavailable", () => {
    let personId: string;

    beforeEach(async () => {
      personId = await seedPerson();
      await seedLibraryGame(db.prisma, personId, {
        title: GAME_TITLE,
        igdbId: GAME_IGDB_ID,
        release: exactDay("2026-11-20", {
          releaseDateCheckedAt: THREE_DAYS_AGO,
        }),
      });
      igdbFetchMock.mockRejectedValue(new Error("IGDB is down"));
    });

    describe("when the person opens Home", () => {
      beforeEach(async () => {
        await actions.openHomeOrLibrary(personId);
        await actions.readHome(personId);
      });

      it("shows the last known date in Coming soon", () => {
        expect(elements.getComingSoonEntry()).toHaveTextContent("Fri 20 Nov");
      });

      it("shows no error message", () => {
        expect(screen.queryByRole("alert")).toBeNull();
        expect(document.body).not.toHaveTextContent("error");
        expect(document.body).not.toHaveTextContent("wrong");
      });
    });

    describe("when the catalogue is back on a later visit", () => {
      beforeEach(async () => {
        await actions.openHomeOrLibrary(personId);
        igdbFetchMock.mockReset();
        igdbAnswers({
          [GAME_IGDB_ID]: igdbReportsExactDay(GAME_IGDB_ID, "2026-11-18"),
        });
        await actions.openHomeOrLibrary(personId);
        await actions.readLibrary(personId);
      });

      it("checks the game again and shows the corrected date", () => {
        expect(elements.getReleaseLineOnCard()).toHaveTextContent("Out 18 Nov");
      });
    });
  });

  describe.each([
    { daysSinceTheMoveFirstShowed: 13, mentionsMove: true },
    { daysSinceTheMoveFirstShowed: 15, mentionsMove: false },
  ])(
    "given a move that first showed $daysSinceTheMoveFirstShowed days ago",
    ({ daysSinceTheMoveFirstShowed, mentionsMove }) => {
      let personId: string;

      beforeEach(async () => {
        personId = await seedPerson();
        await seedLibraryGame(db.prisma, personId, {
          title: GAME_TITLE,
          release: exactDay("2026-12-03", {
            releaseDateCheckedAt: daysBeforeNow(0),
            releaseDateMovedFrom: utcMidnight("2026-11-14"),
            releaseDateMovedAt: daysBeforeNow(daysSinceTheMoveFirstShowed),
          }),
        });
      });

      describe("when the person opens the library", () => {
        beforeEach(async () => {
          await actions.readLibrary(personId);
        });

        it(`${mentionsMove ? "still shows" : "no longer shows"} the Moved line on the card`, () => {
          if (mentionsMove) {
            expect(elements.getMovedLineOnCard()).toHaveTextContent(
              "Moved from 14 Nov"
            );
          } else {
            expect(elements.getMovedLineOnCard()).toBeNull();
          }
        });
      });

      describe("when the person opens Upcoming releases", () => {
        beforeEach(async () => {
          await actions.readUpcomingReleases(personId);
        });

        it(`${mentionsMove ? "still shows" : "no longer shows"} the Moved line on the entry`, () => {
          if (mentionsMove) {
            expect(elements.getUpcomingEntry()).toHaveTextContent(
              "Moved from 14 Nov"
            );
          } else {
            expect(elements.getUpcomingEntry()).not.toHaveTextContent("Moved");
          }
        });
      });
    }
  );
});
