// @vitest-environment jsdom
/**
 * @spec: 029-release-days
 * @regression
 *
 * Functional spec 2.1, 2.2, 2.3: a stored release (date + precision) travels
 * through getLibrary and is shown on library cards (grid and list) and on the
 * game page at exactly the precision it is known, with "Releases" / "Released"
 * wording on the game page.
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

import { createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";
import {
  exactDay,
  freezeTimeAt,
  noDateAtAll,
  seedLibraryGame,
  toBeAnnounced,
  unfreezeTime,
  vagueDay,
  wipeAllTables,
  type ReleaseState,
} from "./support.ts";
import { renderGamePageAbout, renderLibraryCards } from "./surfaces.tsx";

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const GAME_TITLE = "Skyline Run";

const elements = {
  getReleaseLineOnCard: (view: "on grid" | "in list") =>
    within(screen.getByLabelText(`${GAME_TITLE} ${view}`)).queryByTestId(
      "game-card-release"
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
};

type LabelCase = {
  given: string;
  release: ReleaseState;
  libraryCard: string | null;
  gamePage: string | null;
};

const upcomingLabels: LabelCase[] = [
  {
    given: "an exact date of today",
    release: exactDay("2026-11-12"),
    libraryCard: "Out 12 Nov",
    gamePage: "Releases 12 Nov 2026",
  },
  {
    given: "an exact date later this year",
    release: exactDay("2026-12-14"),
    libraryCard: "Out 14 Dec",
    gamePage: "Releases 14 Dec 2026",
  },
  {
    given: "an exact date in a later year",
    release: exactDay("2027-03-14"),
    libraryCard: "Out 14 Mar 2027",
    gamePage: "Releases 14 Mar 2027",
  },
  {
    given: "a release known only as March 2027",
    release: vagueDay("2027-03-01", "MONTH"),
    libraryCard: "Out Mar 2027",
    gamePage: "Releases Mar 2027",
  },
  {
    given: "a release known only as the second quarter of 2027",
    release: vagueDay("2027-04-01", "QUARTER"),
    libraryCard: "Out Q2 2027",
    gamePage: "Releases Q2 2027",
  },
  {
    given: "a release known only as the year 2027",
    release: vagueDay("2027-01-01", "YEAR"),
    libraryCard: "Out 2027",
    gamePage: "Releases 2027",
  },
  {
    given: "a release the catalogue marks as TBA",
    release: toBeAnnounced,
    libraryCard: "Date TBA",
    gamePage: "Release date TBA",
  },
  {
    given: "a month that is still running",
    release: vagueDay("2026-11-01", "MONTH"),
    libraryCard: "Out Nov 2026",
    gamePage: "Releases Nov 2026",
  },
  {
    given: "a year that is still running",
    release: vagueDay("2026-01-01", "YEAR"),
    libraryCard: "Out 2026",
    gamePage: "Releases 2026",
  },
];

const releasedOrUndatedLabels: LabelCase[] = [
  {
    given: "an exact date of yesterday",
    release: exactDay("2026-11-11"),
    libraryCard: null,
    gamePage: "Released 11 Nov 2026",
  },
  {
    given: "a game that came out on 2 June 2020",
    release: exactDay("2020-06-02"),
    libraryCard: null,
    gamePage: "Released 2 Jun 2020",
  },
  {
    given: "a game known only as released in 2020",
    release: vagueDay("2020-01-01", "YEAR"),
    libraryCard: null,
    gamePage: "Released 2020",
  },
  {
    given: "a game with no date",
    release: noDateAtAll,
    libraryCard: null,
    gamePage: null,
  },
  {
    given: "a legacy game never checked, holding a placeholder 31 Dec 2027",
    release: {
      releaseDate: new Date("2027-12-31T00:00:00Z"),
      releaseDatePrecision: null,
      releaseDateCheckedAt: null,
    },
    libraryCard: null,
    gamePage: null,
  },
];

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("spec-029-release-labels");
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

async function openLibraryAndGamePageFor(release: ReleaseState) {
  const user = await createUser(db.prisma);
  await seedLibraryGame(db.prisma, user.id, { title: GAME_TITLE, release });
  const { items } = await getLibrary(user.id, {});
  renderLibraryCards(items);
  renderGamePageAbout(items[0]!.game);
}

describe("release labels across the library and the game page", () => {
  describe.each(upcomingLabels)(
    "given $given",
    ({ release, libraryCard, gamePage }) => {
      beforeEach(async () => {
        await openLibraryAndGamePageFor(release);
      });

      it("shows the label on the grid card", () => {
        expect(elements.getReleaseLineOnCard("on grid")).toHaveTextContent(
          libraryCard!
        );
      });

      it("shows the same label on the list card", () => {
        expect(elements.getReleaseLineOnCard("in list")).toHaveTextContent(
          libraryCard!
        );
      });

      it("says Releases on the game page", () => {
        expect(elements.getReleaseFactOnGamePage()).toBe(gamePage);
      });
    }
  );

  describe.each(releasedOrUndatedLabels)(
    "given $given",
    ({ release, gamePage }) => {
      beforeEach(async () => {
        await openLibraryAndGamePageFor(release);
      });

      it("shows no release line on the grid card", () => {
        expect(elements.getReleaseLineOnCard("on grid")).toBeNull();
      });

      it("shows no release line on the list card", () => {
        expect(elements.getReleaseLineOnCard("in list")).toBeNull();
      });

      it("shows the game page fact the release deserves", () => {
        expect(elements.getReleaseFactOnGamePage()).toBe(gamePage);
      });
    }
  );

  describe("given a release known only as the year 2027", () => {
    beforeEach(async () => {
      await openLibraryAndGamePageFor(vagueDay("2027-01-01", "YEAR"));
    });

    it("never shows a specific day anywhere", () => {
      expect(document.body).not.toHaveTextContent("31 Dec 2027");
      expect(document.body).not.toHaveTextContent("1 Jan 2027");
    });
  });

  describe("given an exact date of 14 March 2027 and a device west of London", () => {
    const originalTimezone = process.env.TZ;

    beforeEach(async () => {
      process.env.TZ = "America/New_York";
      await openLibraryAndGamePageFor(exactDay("2027-03-14"));
    });

    afterEach(() => {
      if (originalTimezone === undefined) delete process.env.TZ;
      else process.env.TZ = originalTimezone;
    });

    it("shows 14 Mar on the card and not 13 Mar", () => {
      expect(elements.getReleaseLineOnCard("on grid")).toHaveTextContent(
        "Out 14 Mar 2027"
      );
    });

    it("shows 14 Mar on the game page and not 13 Mar", () => {
      expect(elements.getReleaseFactOnGamePage()).toBe("Releases 14 Mar 2027");
    });
  });
});
