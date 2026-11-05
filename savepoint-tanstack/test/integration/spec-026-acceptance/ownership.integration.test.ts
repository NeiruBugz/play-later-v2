/**
 * @spec: 026-mindful-core-simplification
 * @regression
 *
 * Journey 3 - ownership: the marker survives status changes, the Want-only
 * "Not owned only" filter, and friends never see ownership, Done outcome or
 * notes.
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
import { getLibrary } from "@/entities/library-item/api/get-library.server";
import { getPublicProfile } from "@/entities/profile/api/get-public-profile.server";
import { addGameWorker } from "@/features/add-game/api/add-game.worker";
import { logTimeWorker } from "@/features/compose-journal-entry/api/log-time-fn.worker";
import { saveDoneFollowUpWorker } from "@/features/done-follow-up/api/save-done-follow-up-fn.worker";
import { setOwnershipWorker } from "@/features/manage-library-entry/api/set-ownership-fn.worker";
import { setStatusWorker } from "@/features/manage-library-entry/api/set-status-fn.worker";
import { __resetTokenCacheForTests } from "@/shared/api/igdb/token";

import { createGame, createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";
import { stubIgdbFor, wipeAllTables } from "./support.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("spec-026-ownership");
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

async function addGame(userId: string, title: string) {
  const game = await createGame(db.prisma, { title, description: "Summary" });
  const added = await addGameWorker(userId, { igdbId: game.igdbId });
  return { game, itemId: added.libraryItemId };
}

describe("given a Want game marked not owned (AC 2.5)", () => {
  it("is owned when added, and keeps Not owned through Playing and back to Want", async () => {
    const user = await createUser(db.prisma);
    const { itemId } = await addGame(user.id, "Wishlisted");
    const read = () =>
      db.prisma.libraryItem.findUniqueOrThrow({ where: { id: itemId } });

    // 2.5: "When the user adds a game, then it is marked as owned"
    expect((await read()).isOwned).toBe(true);

    await setOwnershipWorker(user.id, { id: itemId, isOwned: false });
    await setStatusWorker(user.id, { id: itemId, to: "PLAYING" });
    expect((await read()).isOwned).toBe(false);
    await setStatusWorker(user.id, { id: itemId, to: "WANT" });

    // 2.5: "it still shows the 'Not owned' tag"
    expect(await read()).toMatchObject({ status: "WANT", isOwned: false });
  });

  it("is listed by Not owned only under the Want filter, and only there", async () => {
    const user = await createUser(db.prisma);
    const notOwnedWant = await addGame(user.id, "Not owned want");
    await addGame(user.id, "Owned want");
    const notOwnedPlaying = await addGame(user.id, "Not owned playing");
    await setOwnershipWorker(user.id, {
      id: notOwnedWant.itemId,
      isOwned: false,
    });
    await setOwnershipWorker(user.id, {
      id: notOwnedPlaying.itemId,
      isOwned: false,
    });
    await setStatusWorker(user.id, {
      id: notOwnedPlaying.itemId,
      to: "PLAYING",
    });

    const filtered = await getLibrary(user.id, {
      status: "WANT",
      notOwnedOnly: true,
    });
    const wantUnfiltered = await getLibrary(user.id, { status: "WANT" });
    const playing = await getLibrary(user.id, {
      status: "PLAYING",
      notOwnedOnly: true,
    });

    // 2.5: "only Want games marked as not owned are listed"
    expect(filtered.items.map((item) => item.game.title)).toEqual([
      "Not owned want",
    ]);
    expect(wantUnfiltered.total).toBe(2);
    // 2.5: the toggle exists only with Want, so it never narrows other views
    expect(playing.items.map((item) => item.game.title)).toEqual([
      "Not owned playing",
    ]);
  });
});

describe("given a friend following a public profile (AC 2.5, 2.7, 2.9)", () => {
  const SECRET_NOTE = "PRIVATE-NOTE-TEXT-9d2e";

  async function seedOwnerAndFriend() {
    const owner = await createUser(db.prisma, {
      isPublicProfile: true,
      username: "ownerjourney",
      usernameNormalized: "ownerjourney",
    });
    const friend = await createUser(db.prisma, { isPublicProfile: true });
    await db.prisma.follow.create({
      data: { followerId: friend.id, followingId: owner.id },
    });

    const wanted = await addGame(owner.id, "Not owned wishlist");
    await setOwnershipWorker(owner.id, { id: wanted.itemId, isOwned: false });

    const finished = await addGame(owner.id, "Let go game");
    stubIgdbFor(finished.game);
    await setStatusWorker(owner.id, { id: finished.itemId, to: "PLAYING" });
    await logTimeWorker(owner.id, {
      gameId: finished.game.id,
      playedMinutes: 60,
      content: SECRET_NOTE,
    });
    await setStatusWorker(owner.id, { id: finished.itemId, to: "DONE" });
    await saveDoneFollowUpWorker(owner.id, {
      id: finished.itemId,
      outcome: "LET_GO",
      rating: 6,
      stayed: SECRET_NOTE,
    });

    return { owner, friend, wanted, finished };
  }

  it("never receives ownership, Done outcome or note text from any friend-facing read", async () => {
    const { owner, friend, finished } = await seedOwnerAndFriend();

    const reads = {
      activity: await getActivityForUser(owner.id, friend.id),
      anonymousActivity: await getActivityForUser(owner.id, undefined),
      feed: await getActivityFeedForViewer(friend.id),
      profile: await getPublicProfile("ownerjourney", friend.id),
      gamePage: await getGameDetails({
        slug: finished.game.slug,
        userId: friend.id,
      }),
    };

    expect(reads.gamePage.doneOutcome).toBeNull();
    expect(reads.gamePage.libraryEntry).toBeNull();
    expect(reads.activity.items).toHaveLength(2);
    expect(reads.feed.items).toHaveLength(2);
    for (const [name, value] of Object.entries(reads)) {
      const json = JSON.stringify(value);
      // 2.5: "no ownership information is shown"
      expect(json, name).not.toContain("isOwned");
      // 2.7: "they see Done without Finished or Let go"
      expect(json, name).not.toContain("LET_GO");
      expect(json, name).not.toContain("FINISHED");
      // 2.9: "none of the user's notes are visible"
      expect(json, name).not.toContain(SECRET_NOTE);
    }
  });

  it("shows friends each game once, with its current status", async () => {
    const { friend } = await seedOwnerAndFriend();

    const feed = await getActivityFeedForViewer(friend.id);

    // 2.13: "each game at most once, describing its current status"
    const titles = feed.items.map((item) => item.gameTitle);
    expect(new Set(titles).size).toBe(titles.length);
    expect(
      Object.fromEntries(
        feed.items.map((item) => [item.gameTitle, item.status])
      )
    ).toEqual({ "Not owned wishlist": "WANT", "Let go game": "DONE" });
  });
});
