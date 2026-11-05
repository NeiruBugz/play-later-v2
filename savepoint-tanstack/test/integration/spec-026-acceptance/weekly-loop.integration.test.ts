/**
 * @spec: 026-mindful-core-simplification
 * @regression
 *
 * Journey 1 - the weekly loop through the real write paths:
 * add -> why answer -> Start playing -> log 1.5 h (no text) -> Mark done with
 * follow-up (Let go + stayed note + rating) -> Play again -> Done again.
 */

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

import { getGameDetails } from "@/entities/game/api/get-game-details.server";
import { PROMPT_QUESTION } from "@/entities/journal-entry/ui/prompt-question/prompt-question";
import { addGameWorker } from "@/features/add-game/api/add-game.worker";
import { logTimeWorker } from "@/features/compose-journal-entry/api/log-time-fn.worker";
import { saveDoneFollowUpWorker } from "@/features/done-follow-up/api/save-done-follow-up-fn.worker";
import { answerPromptWorker } from "@/features/library-prompts/api/answer-prompt-fn.worker";
import { setStatusWorker } from "@/features/manage-library-entry/api/set-status-fn.worker";
import { undoStatusWorker } from "@/features/manage-library-entry/api/undo-status-fn.worker";
import { __resetTokenCacheForTests } from "@/shared/api/igdb/token";

import { createGame, createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";
import { pause, stubIgdbFor, wipeAllTables } from "./support.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("spec-026-weekly-loop");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  __resetTokenCacheForTests();
  await wipeAllTables(db);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function seedWantGame() {
  const user = await createUser(db.prisma);
  const stranger = await createUser(db.prisma);
  const game = await createGame(db.prisma, { description: "Summary" });
  stubIgdbFor(game);
  const added = await addGameWorker(user.id, { igdbId: game.igdbId });
  return { user, stranger, game, itemId: added.libraryItemId, added };
}

async function detailsFor(slug: string, userId: string | undefined) {
  return getGameDetails({ slug, userId });
}

describe("given a game added from search (AC 2.6 add as Want, 2.8 why prompt)", () => {
  it("then it is Want, owned, and answering why writes one note headed by its question", async () => {
    const { user, game, itemId, added } = await seedWantGame();

    // 2.6: "One tap adds the game as Want"; 2.5: "it is marked as owned"
    expect(added).toMatchObject({ created: true, status: "WANT" });
    const item = await db.prisma.libraryItem.findUniqueOrThrow({
      where: { id: itemId },
    });
    expect(item.isOwned).toBe(true);

    // 2.8: unanswered Want game offers the why prompt on the game page
    expect((await detailsFor(game.slug, user.id)).prompts.why).toBe(true);

    await answerPromptWorker(user.id, {
      id: itemId,
      kind: "WHY",
      text: "Heard it is great",
    });

    // 2.8: "answer appears as a note ... under the heading 'Why do you want to play this?'"
    const details = await detailsFor(game.slug, user.id);
    expect(details.notes).toHaveLength(1);
    expect(details.notes[0]).toMatchObject({
      content: "Heard it is great",
      prompt: "WHY",
    });
    expect(PROMPT_QUESTION[details.notes[0]!.prompt!]).toBe(
      "Why do you want to play this?"
    );
    expect(details.prompts.why).toBe(false);
  });
});

describe("given the whole weekly loop is played through", () => {
  async function playTheLoop() {
    const seeded = await seedWantGame();
    const { user, game, itemId } = seeded;

    await answerPromptWorker(user.id, {
      id: itemId,
      kind: "WHY",
      text: "Heard it is great",
    });
    await pause();

    const start = await setStatusWorker(user.id, { id: itemId, to: "PLAYING" });
    await pause();

    const logged = await logTimeWorker(user.id, {
      gameId: game.id,
      playedMinutes: 90,
    });
    await pause();

    const done = await setStatusWorker(user.id, { id: itemId, to: "DONE" });
    await pause();
    await saveDoneFollowUpWorker(user.id, {
      id: itemId,
      outcome: "LET_GO",
      rating: 7,
      stayed: "Atmosphere stayed with me",
    });
    await pause();

    const replay = await setStatusWorker(user.id, {
      id: itemId,
      to: "PLAYING",
    });
    await pause();
    await logTimeWorker(user.id, {
      gameId: game.id,
      playedMinutes: 30,
      content: "Second run, faster",
    });
    await pause();
    const doneAgain = await setStatusWorker(user.id, {
      id: itemId,
      to: "DONE",
    });

    return { ...seeded, start, logged, done, replay, doneAgain };
  }

  it("logs 1.5 h with no text while Playing: saves, status unchanged, no mark-playing offer (2.2, 2.19, 2.9)", async () => {
    const { user, game, itemId, logged } = await playTheLoopUntilLogged();

    // 2.19: time-only log for a game that became Playing by status alone saves
    expect(logged.offerMarkPlaying).toBe(false);
    // 2.2: "the status still reads Playing"
    const item = await db.prisma.libraryItem.findUniqueOrThrow({
      where: { id: itemId },
    });
    expect(item.status).toBe("PLAYING");
    // 2.16: "1.5 h" = 90 minutes, one session
    const details = await detailsFor(game.slug, user.id);
    expect(details.playtimeTotalMinutes).toBe(90);
    expect(details.playtimeSessionCount).toBe(1);
  });

  async function playTheLoopUntilLogged() {
    const seeded = await seedWantGame();
    await setStatusWorker(seeded.user.id, {
      id: seeded.itemId,
      to: "PLAYING",
    });
    const logged = await logTimeWorker(seeded.user.id, {
      gameId: seeded.game.id,
      playedMinutes: 90,
    });
    return { ...seeded, logged };
  }

  it("ends with History of 2 ended plays, newest first, and the in-progress play never listed (2.10)", async () => {
    const { user, game } = await playTheLoop();

    const details = await detailsFor(game.slug, user.id);

    // 2.10: "Done after one play, Play again, Done again -> History lists two plays"
    expect(details.history).toHaveLength(2);
    const [newest, older] = details.history;
    expect(newest!.finishedAt.getTime()).toBeGreaterThan(
      older!.finishedAt.getTime()
    );
    expect(newest!.startedAt!.getTime()).toBeGreaterThan(
      older!.startedAt!.getTime()
    );
    expect(details.libraryEntry?.status).toBe("DONE");
  });

  it("shows time played equal to the notes total, matching the session count (2.16)", async () => {
    const { user, game } = await playTheLoop();

    const details = await detailsFor(game.slug, user.id);

    const noteMinutes = details.notes.reduce(
      (sum, note) => sum + (note.playedMinutes ?? 0),
      0
    );
    // 2.16: "Time played ... the sum of all time logged"; 90 + 30 = 2 h
    expect(details.playtimeTotalMinutes).toBe(120);
    expect(details.playtimeTotalMinutes).toBe(noteMinutes);
    // 2.16: session count is the number of logs with time
    expect(details.playtimeSessionCount).toBe(
      details.notes.filter((note) => (note.playedMinutes ?? 0) > 0).length
    );
    expect(details.playtimeSessionCount).toBe(2);
  });

  it("lists each note exactly once, newest first, with prompt notes keeping their headings (2.8, 2.9)", async () => {
    const { user, game } = await playTheLoop();

    const details = await detailsFor(game.slug, user.id);

    // 2.9: "each note appears exactly once, in one list, newest first"
    const ids = details.notes.map((note) => note.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(details.notes.map((note) => note.content)).toEqual([
      "Second run, faster",
      "Atmosphere stayed with me",
      "",
      "Heard it is great",
    ]);
    const createdAt = details.notes.map((note) => note.createdAt.getTime());
    expect(createdAt).toEqual([...createdAt].sort((a, b) => b - a));
    // 2.9: a time-only note keeps minutes with no text ("1.5 h played")
    expect(details.notes[2]).toMatchObject({ playedMinutes: 90, prompt: null });
    // 2.7 / 2.8: prompt notes are headed by their question
    expect(
      details.notes.map((note) =>
        note.prompt ? PROMPT_QUESTION[note.prompt] : null
      )
    ).toEqual([
      null,
      "What stayed with you?",
      null,
      "Why do you want to play this?",
    ]);
  });

  it("keeps Let go and the rating for the owner only (2.7, 2.11)", async () => {
    const { user, stranger, game } = await playTheLoop();

    const asOwner = await detailsFor(game.slug, user.id);
    // 2.7: "Done · Let go" on the user's own game page; 2.11: one rating
    expect(asOwner.doneOutcome).toBe("LET_GO");
    expect(asOwner.libraryEntry?.rating).toBe(7);

    // 2.7: "How it ended is private ... never shown to anyone else"
    for (const viewer of [stranger.id, undefined]) {
      const details = await detailsFor(game.slug, viewer);
      expect(details.doneOutcome).toBeNull();
      expect(details.libraryEntry).toBeNull();
      expect(JSON.stringify(details)).not.toContain("LET_GO");
      expect(details.notes).toEqual([]);
    }
  });

  it("offers the stayed prompt again after the second Done, because it is answered per Done (2.8)", async () => {
    const { user, game } = await playTheLoop();

    const details = await detailsFor(game.slug, user.id);

    // 2.8: "no answer since it last became Done" -> field returns
    expect(details.prompts).toEqual({ why: false, stayed: true });
  });
});

describe("given undo is used at each step of the loop (2.3)", () => {
  it("undoing Start playing returns to Want with no play added", async () => {
    const { user, game, itemId } = await seedWantGame();

    const start = await setStatusWorker(user.id, { id: itemId, to: "PLAYING" });
    const restored = await undoStatusWorker(user.id, {
      id: itemId,
      undo: start.undo,
    });

    // 2.3: "returns to its previous status" and "no new play has been added"
    expect(restored.status).toBe("WANT");
    expect(await db.prisma.playthrough.count()).toBe(0);
    expect((await detailsFor(game.slug, user.id)).history).toEqual([]);
  });

  it("undoing Mark done reopens the play and leaves History empty", async () => {
    const { user, game, itemId } = await seedWantGame();
    await setStatusWorker(user.id, { id: itemId, to: "PLAYING" });
    await pause();
    const done = await setStatusWorker(user.id, { id: itemId, to: "DONE" });
    expect((await detailsFor(game.slug, user.id)).history).toHaveLength(1);

    const restored = await undoStatusWorker(user.id, {
      id: itemId,
      undo: done.undo,
    });

    expect(restored.status).toBe("PLAYING");
    expect(
      await db.prisma.playthrough.count({
        where: { libraryItemId: itemId, finishedAt: null },
      })
    ).toBe(1);
    expect((await detailsFor(game.slug, user.id)).history).toEqual([]);
  });

  it("undoing Play again returns to Done with the earlier play intact and no play added", async () => {
    const { user, game, itemId } = await seedWantGame();
    await setStatusWorker(user.id, { id: itemId, to: "PLAYING" });
    await pause();
    await setStatusWorker(user.id, { id: itemId, to: "DONE" });
    await saveDoneFollowUpWorker(user.id, { id: itemId, outcome: "LET_GO" });
    await pause();

    const replay = await setStatusWorker(user.id, {
      id: itemId,
      to: "PLAYING",
    });
    const restored = await undoStatusWorker(user.id, {
      id: itemId,
      undo: replay.undo,
    });

    expect(restored.status).toBe("DONE");
    expect(await db.prisma.playthrough.count()).toBe(1);
    const details = await detailsFor(game.slug, user.id);
    expect(details.history).toHaveLength(1);
    // 2.3: Undo restores the previous state wholesale, including the private outcome
    expect(details.doneOutcome).toBe("LET_GO");
  });
});
