/**
 * @spec: 026-mindful-core-simplification
 * @regression
 *
 * Journey 7 - read shapes (AC 2.17, 2.9): Home carries no "Recently played" or
 * second stats block; the Journal sorts by when notes were written, never
 * moves an edited note, and filters by game including "No game".
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createJournalEntry } from "@/entities/journal-entry/api/create-journal-entry.server";
import {
  getJournalGameOptions,
  getJournalTimeline,
} from "@/entities/journal-entry/api/get-journal.server";
import { updateJournalEntry } from "@/entities/journal-entry/api/update-journal-entry.server";
import { getDashboardPageDataWorker } from "@/features/dashboard/api/get-dashboard-page-data.worker";
import { setStatusWorker } from "@/features/manage-library-entry/api/set-status-fn.worker";
import { addToUpNextWorker } from "@/features/up-next/api/add-to-up-next-fn.worker";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";
import { pause, wipeAllTables } from "./support.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("spec-026-read-shapes");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await wipeAllTables(db);
});

async function seedGame(userId: string, title: string) {
  const game = await createGame(db.prisma, { title });
  const item = await createLibraryItem(db.prisma, {
    userId,
    gameId: game.id,
    status: "WANT",
  });
  return { game, item };
}

describe("given a library with Playing, queued and Done games (AC 2.17 Home)", () => {
  it("returns only playing, upNextTop3, upNextTotal and counts", async () => {
    const user = await createUser(db.prisma);
    const playing = await seedGame(user.id, "Now");
    await setStatusWorker(user.id, { id: playing.item.id, to: "PLAYING" });
    for (const title of ["Q1", "Q2", "Q3", "Q4"]) {
      const queued = await seedGame(user.id, title);
      await addToUpNextWorker(user.id, { id: queued.item.id });
    }
    const done = await seedGame(user.id, "Finished");
    await setStatusWorker(user.id, { id: done.item.id, to: "DONE" });

    const home = await getDashboardPageDataWorker(user.id);

    // 2.17: no "Recently played" section, no second stats card or distribution bar
    expect(Object.keys(home).sort()).toEqual([
      "counts",
      "playing",
      "upNextTop3",
      "upNextTotal",
    ]);
    expect(home).not.toHaveProperty("recentlyPlayed");
    expect(home).not.toHaveProperty("stats");
    // 2.17: the games being played, each once; one set of status counts
    expect(home.playing.map((item) => item.game.title)).toEqual(["Now"]);
    expect(home.counts).toEqual({ WANT: 4, PLAYING: 1, DONE: 1 });
    // 2.4: first 3 queued in queue order, with the full size for "See all"
    expect(home.upNextTop3.map((item) => item.game.title)).toEqual([
      "Q1",
      "Q2",
      "Q3",
    ]);
    expect(home.upNextTotal).toBe(4);
  });

  it("shows an empty Home payload for a new user: nothing playing, nothing queued", async () => {
    const user = await createUser(db.prisma);

    const home = await getDashboardPageDataWorker(user.id);

    // 2.17: the single empty state is driven by these two being empty
    expect(home.playing).toEqual([]);
    expect(home.upNextTotal).toBe(0);
  });
});

describe("given notes on two games and one general note (AC 2.9, 2.17 Journal)", () => {
  async function seedNotes() {
    const user = await createUser(db.prisma);
    const first = await seedGame(user.id, "Alpha");
    const second = await seedGame(user.id, "Beta");
    const oldest = await createJournalEntry(user.id, {
      gameId: first.game.id,
      content: "alpha first",
    });
    await pause();
    const middle = await createJournalEntry(user.id, {
      gameId: second.game.id,
      playedMinutes: 90,
    });
    await pause();
    const general = await createJournalEntry(user.id, {
      content: "one big RPG at a time",
    });
    return { user, first, second, oldest, middle, general };
  }

  it("lists notes newest written first, even after an old note is edited", async () => {
    const { user, oldest, middle, general } = await seedNotes();

    await pause();
    await updateJournalEntry(user.id, oldest.id, {
      content: "alpha first, edited",
      playedMinutes: 30,
    });
    const timeline = await getJournalTimeline(user.id);

    // 2.9: "Editing a note never moves it or changes its date"
    expect(timeline.map((note) => note.id)).toEqual([
      general.id,
      middle.id,
      oldest.id,
    ]);
    const edited = timeline.find((note) => note.id === oldest.id)!;
    expect(edited.createdAt).toEqual(oldest.createdAt);
    expect(edited).toMatchObject({
      content: "alpha first, edited",
      playedMinutes: 30,
    });
  });

  it("filters by game, by No game, and shows everything for All", async () => {
    const { user, second, general, middle, oldest } = await seedNotes();

    const all = await getJournalTimeline(user.id);
    const byGame = await getJournalTimeline(user.id, {
      gameId: second.game.id,
    });
    const noGame = await getJournalTimeline(user.id, { gameId: "none" });

    // 2.9: "All" lists every note; a game lists only its notes; "No game" only general notes
    expect(all.map((note) => note.id)).toEqual([
      general.id,
      middle.id,
      oldest.id,
    ]);
    expect(byGame.map((note) => note.id)).toEqual([middle.id]);
    expect(noGame.map((note) => note.id)).toEqual([general.id]);
  });

  it("offers a filter option for each game that has notes", async () => {
    const { user } = await seedNotes();
    await seedGame(user.id, "Gamma with no notes");

    const options = await getJournalGameOptions(user.id);

    expect(options.map((option) => option.title)).toEqual(["Alpha", "Beta"]);
  });

  it("exposes no kind, mood or title on any note", async () => {
    const { user } = await seedNotes();

    const timeline = await getJournalTimeline(user.id);

    // 2.9: "no type label, mood, tags, or title"
    for (const note of timeline) {
      expect(note).not.toHaveProperty("kind");
      expect(note).not.toHaveProperty("mood");
      expect(note).not.toHaveProperty("title");
    }
  });
});
