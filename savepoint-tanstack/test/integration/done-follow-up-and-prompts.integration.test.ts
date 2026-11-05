/**
 * Spec 026 slice 8: Done follow-up (§2.7) and optional prompts (§2.8).
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

import {
  getActivityFeedForViewer,
  getActivityForUser,
} from "@/entities/activity-feed/api/get-activity-feed.server";
import { getGameDetails } from "@/entities/game/api/get-game-details.server";
import { getLibraryStats } from "@/entities/library-item/api/get-library-stats.server";
import { setDoneOutcome } from "@/entities/library-item/api/set-done-outcome.server";
import { setLibraryItemStatus } from "@/entities/library-item/api/set-library-item-status.server";
import { setRating } from "@/entities/library-item/api/set-rating.server";
import { getPublicProfile } from "@/entities/profile/api/get-public-profile.server";
import { saveDoneFollowUpWorker } from "@/features/done-follow-up/api/save-done-follow-up-fn.worker";
import { setDoneOutcomeWorker } from "@/features/done-follow-up/api/set-done-outcome-fn.worker";
import { answerPromptWorker } from "@/features/library-prompts/api/answer-prompt-fn.worker";
import { dismissPromptWorker } from "@/features/library-prompts/api/dismiss-prompt-fn.worker";
import { undoStatusWorker } from "@/features/manage-library-entry/api/undo-status-fn.worker";
import { __resetTokenCacheForTests } from "@/shared/api/igdb/token";
import { NotFoundError, ValidationError } from "@/shared/lib/errors";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("done-follow-up-and-prompts");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  __resetTokenCacheForTests();
  await db.prisma.follow.deleteMany();
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.playthrough.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const tick = () => new Promise((resolve) => setTimeout(resolve, 15));

function stubIgdbFor(game: { igdbId: number; title: string; slug: string }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string) => {
      const body = url.includes("id.twitch.tv")
        ? { access_token: "tok", expires_in: 3600, token_type: "bearer" }
        : [
            {
              id: game.igdbId,
              name: game.title,
              slug: game.slug,
              summary: "Summary",
            },
          ];
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => body,
      } as Response);
    })
  );
}

async function seed(status: "WANT" | "PLAYING" | "DONE", rating?: number) {
  const user = await createUser(db.prisma);
  const game = await createGame(db.prisma, { description: "Summary" });
  const item = await createLibraryItem(db.prisma, {
    userId: user.id,
    gameId: game.id,
    status,
    statusChangedAt: new Date("2025-01-01T00:00:00.000Z"),
    ...(rating !== undefined ? { rating } : {}),
  });
  stubIgdbFor(game);
  return { user, game, item };
}

async function row(id: number) {
  return db.prisma.libraryItem.findUniqueOrThrow({ where: { id } });
}

async function promptsFor(game: { slug: string }, userId: string | undefined) {
  return (await getGameDetails({ slug: game.slug, userId })).prompts;
}

describe("setDoneOutcome / setRating", () => {
  it("writes the outcome on a Done game and clears it with null", async () => {
    const { user, item } = await seed("DONE");

    await setDoneOutcome(user.id, item.id, "LET_GO");
    expect((await row(item.id)).doneOutcome).toBe("LET_GO");

    await setDoneOutcome(user.id, item.id, null);
    expect((await row(item.id)).doneOutcome).toBeNull();
  });

  it("rejects an outcome while the game is not Done", async () => {
    const { user, item } = await seed("WANT");

    await expect(
      setDoneOutcome(user.id, item.id, "FINISHED")
    ).rejects.toBeInstanceOf(ValidationError);
    expect((await row(item.id)).doneOutcome).toBeNull();
  });

  it("keeps the outcome when the game leaves Done", async () => {
    const { user, item } = await seed("DONE");
    await setDoneOutcome(user.id, item.id, "FINISHED");

    await setLibraryItemStatus(user.id, item.id, "PLAYING");

    expect((await row(item.id)).doneOutcome).toBe("FINISHED");
  });

  it("rejects another user's item with NotFoundError", async () => {
    const { item } = await seed("DONE");
    const stranger = await createUser(db.prisma);

    await expect(
      setDoneOutcome(stranger.id, item.id, "FINISHED")
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(setRating(stranger.id, item.id, 5)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("stores a rating of 1..10, clears it with null, and rejects the rest", async () => {
    const { user, item } = await seed("DONE");

    await setRating(user.id, item.id, 8);
    expect((await row(item.id)).rating).toBe(8);
    await setRating(user.id, item.id, null);
    expect((await row(item.id)).rating).toBeNull();

    for (const bad of [0, 11, 4.5]) {
      await expect(setRating(user.id, item.id, bad)).rejects.toBeInstanceOf(
        ValidationError
      );
    }
  });

  it("setDoneOutcomeWorker returns the stored label", async () => {
    const { user, item } = await seed("DONE");

    await expect(
      setDoneOutcomeWorker(user.id, { id: item.id, outcome: "LET_GO" })
    ).resolves.toEqual({ doneOutcome: "LET_GO" });
  });
});

describe("saveDoneFollowUpWorker", () => {
  it("writes the outcome, replaces the rating and creates a STAYED note", async () => {
    const { user, item } = await seed("DONE", 6);

    const result = await saveDoneFollowUpWorker(user.id, {
      id: item.id,
      outcome: "LET_GO",
      rating: 9,
      stayed: "  The ending  ",
    });

    const after = await row(item.id);
    expect(after.doneOutcome).toBe("LET_GO");
    expect(after.rating).toBe(9);
    expect(after.status).toBe("DONE");

    const notes = await db.prisma.journalEntry.findMany({
      where: { userId: user.id },
    });
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      id: result.noteId,
      content: "The ending",
      prompt: "STAYED",
      gameId: item.gameId,
    });
  });

  it("an empty follow-up (Skip) writes nothing", async () => {
    const { user, item } = await seed("DONE", 6);
    const before = await row(item.id);

    const result = await saveDoneFollowUpWorker(user.id, { id: item.id });
    const blank = await saveDoneFollowUpWorker(user.id, {
      id: item.id,
      stayed: "   ",
    });

    expect(result).toEqual({});
    expect(blank).toEqual({});
    expect(await row(item.id)).toEqual(before);
    expect(await db.prisma.journalEntry.count()).toBe(0);
  });

  it("is all-or-nothing: an invalid rating writes no outcome and no note", async () => {
    const { user, item } = await seed("DONE");

    await expect(
      saveDoneFollowUpWorker(user.id, {
        id: item.id,
        outcome: "FINISHED",
        rating: 99,
        stayed: "x",
      })
    ).rejects.toThrow();

    expect((await row(item.id)).doneOutcome).toBeNull();
    expect(await db.prisma.journalEntry.count()).toBe(0);
  });

  it("rejects a game that is not Done and another user's game", async () => {
    const { user, item } = await seed("WANT");
    const stranger = await createUser(db.prisma);

    await expect(
      saveDoneFollowUpWorker(user.id, { id: item.id, outcome: "FINISHED" })
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      saveDoneFollowUpWorker(stranger.id, { id: item.id, stayed: "x" })
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(await db.prisma.journalEntry.count()).toBe(0);
  });

  it("Undo with the Done payload restores the previous status and the skipped follow-up wrote nothing", async () => {
    const { user, item } = await seed("WANT", 4);
    const before = await row(item.id);

    const { undo } = await setLibraryItemStatus(user.id, item.id, "DONE");
    await undoStatusWorker(user.id, { id: item.id, undo });

    const after = await row(item.id);
    expect(after.status).toBe("WANT");
    expect(after.statusChangedAt).toEqual(before.statusChangedAt);
    expect(after.doneOutcome).toBeNull();
    expect(after.rating).toBe(4);
    expect(await db.prisma.journalEntry.count()).toBe(0);
  });
});

describe("the why prompt", () => {
  it("is true for a fresh Want game", async () => {
    const { user, game } = await seed("WANT");

    expect(await promptsFor(game, user.id)).toEqual({
      why: true,
      stayed: false,
    });
  });

  it("is false after answering, and the answer is a WHY note", async () => {
    const { user, game, item } = await seed("WANT");

    const { noteId } = await answerPromptWorker(user.id, {
      id: item.id,
      kind: "WHY",
      text: "Friends rave about it",
    });

    expect((await promptsFor(game, user.id)).why).toBe(false);
    const details = await getGameDetails({ slug: game.slug, userId: user.id });
    expect(details.notes).toEqual([
      expect.objectContaining({ id: noteId, prompt: "WHY" }),
    ]);
  });

  it("is false after dismissing, and stays dismissed", async () => {
    const { user, game, item } = await seed("WANT");

    await dismissPromptWorker(user.id, { id: item.id, kind: "WHY" });

    expect((await promptsFor(game, user.id)).why).toBe(false);
    expect((await row(item.id)).whyPromptDismissedAt).not.toBeNull();
  });

  it("is false while Playing", async () => {
    const { user, game, item } = await seed("WANT");

    await setLibraryItemStatus(user.id, item.id, "PLAYING");

    expect(await promptsFor(game, user.id)).toEqual({
      why: false,
      stayed: false,
    });
  });

  it("rejects an empty answer", async () => {
    const { user, item } = await seed("WANT");

    await expect(
      answerPromptWorker(user.id, { id: item.id, kind: "WHY", text: "  " })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("the stayed prompt", () => {
  it("is true for a Done game and false for Want", async () => {
    const { user, game, item } = await seed("WANT");
    expect((await promptsFor(game, user.id)).stayed).toBe(false);

    await setLibraryItemStatus(user.id, item.id, "DONE");

    expect(await promptsFor(game, user.id)).toEqual({
      why: false,
      stayed: true,
    });
  });

  it("is false after answering", async () => {
    const { user, game, item } = await seed("WANT");
    await setLibraryItemStatus(user.id, item.id, "DONE");
    await tick();

    await answerPromptWorker(user.id, {
      id: item.id,
      kind: "STAYED",
      text: "The music",
    });

    expect((await promptsFor(game, user.id)).stayed).toBe(false);
  });

  it("is false after the follow-up Save wrote a STAYED note", async () => {
    const { user, game, item } = await seed("WANT");
    await setLibraryItemStatus(user.id, item.id, "DONE");
    await tick();

    await saveDoneFollowUpWorker(user.id, { id: item.id, stayed: "Ending" });

    expect((await promptsFor(game, user.id)).stayed).toBe(false);
  });

  it("is false after dismissing", async () => {
    const { user, game, item } = await seed("WANT");
    await setLibraryItemStatus(user.id, item.id, "DONE");
    await tick();

    await dismissPromptWorker(user.id, { id: item.id, kind: "STAYED" });

    expect((await promptsFor(game, user.id)).stayed).toBe(false);
  });

  it("is true again after Done, Play again, Done", async () => {
    const { user, game, item } = await seed("WANT");
    await setLibraryItemStatus(user.id, item.id, "DONE");
    await tick();
    await answerPromptWorker(user.id, {
      id: item.id,
      kind: "STAYED",
      text: "First time",
    });
    await dismissPromptWorker(user.id, { id: item.id, kind: "STAYED" });
    expect((await promptsFor(game, user.id)).stayed).toBe(false);
    await tick();

    await setLibraryItemStatus(user.id, item.id, "PLAYING");
    expect((await promptsFor(game, user.id)).stayed).toBe(false);
    await tick();
    await setLibraryItemStatus(user.id, item.id, "DONE");

    expect((await promptsFor(game, user.id)).stayed).toBe(true);
  });
});

describe("a viewer who does not own the item", () => {
  it("sees no doneOutcome, no prompts, and no libraryEntry", async () => {
    const { user, game, item } = await seed("DONE");
    await setDoneOutcome(user.id, item.id, "LET_GO");
    const other = await createUser(db.prisma);

    const asOwner = await getGameDetails({ slug: game.slug, userId: user.id });
    expect(asOwner.doneOutcome).toBe("LET_GO");

    for (const viewer of [other.id, undefined]) {
      const details = await getGameDetails({ slug: game.slug, userId: viewer });
      expect(details.doneOutcome).toBeNull();
      expect(details.prompts).toEqual({ why: false, stayed: false });
      expect(details.libraryEntry).toBeNull();
      expect(JSON.stringify(details)).not.toContain("LET_GO");
    }
  });
});

describe("doneOutcome stays private", () => {
  it("never appears in friend-facing reads", async () => {
    const owner = await createUser(db.prisma, {
      isPublicProfile: true,
      username: "privateoutcome",
      usernameNormalized: "privateoutcome",
    });
    const viewer = await createUser(db.prisma, { isPublicProfile: true });
    const game = await createGame(db.prisma);
    await createLibraryItem(db.prisma, {
      userId: owner.id,
      gameId: game.id,
      status: "DONE",
      doneOutcome: "LET_GO",
      rating: 7,
    });
    await db.prisma.follow.create({
      data: { followerId: viewer.id, followingId: owner.id },
    });

    const reads = {
      activity: await getActivityForUser(owner.id, viewer.id),
      feed: await getActivityFeedForViewer(viewer.id),
      profile: await getPublicProfile("privateoutcome", viewer.id),
    };

    expect(reads.activity.items).toHaveLength(1);
    expect(reads.feed.items).toHaveLength(1);
    for (const [name, value] of Object.entries(reads)) {
      const json = JSON.stringify(value);
      expect(json, name).not.toContain("doneOutcome");
      expect(json, name).not.toContain("LET_GO");
    }
  });

  it("is never counted: getLibraryStats has only status counts", async () => {
    const { user, item } = await seed("DONE");
    await setDoneOutcome(user.id, item.id, "FINISHED");

    const stats = await getLibraryStats(user.id);

    expect(Object.keys(stats).sort()).toEqual([
      "done",
      "journalCount",
      "playing",
      "recentGames",
      "want",
    ]);
    expect(JSON.stringify(stats)).not.toMatch(/FINISHED|LET_GO|doneOutcome/);
  });
});
