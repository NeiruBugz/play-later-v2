/**
 * Notes are private (spec 026 §2.9): no public profile, playthrough, activity
 * or friend read returns a note, and the note reads are owner-scoped.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  getActivityFeedForViewer,
  getActivityForUser,
} from "@/entities/activity-feed/api/get-activity-feed.server";
import { getJournalEntryById } from "@/entities/journal-entry/api/get-journal-entry-by-id.server";
import { getJournalTimeline } from "@/entities/journal-entry/api/get-journal.server";
import { getPublicProfile } from "@/entities/profile/api/get-public-profile.server";
import { NotFoundError } from "@/shared/lib/errors";

import {
  createGame,
  createLibraryItem,
  createNote,
  createPlay,
  createUser,
} from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("notes-stay-private");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.follow.deleteMany();
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.playthrough.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

const SECRET = "SECRET-NOTE-TEXT-7c1f";

describe("given a user with a public profile and a note on a played game", () => {
  async function seed() {
    const owner = await createUser(db.prisma, { isPublicProfile: true });
    const friend = await createUser(db.prisma, { isPublicProfile: true });
    const game = await createGame(db.prisma);
    const item = await createLibraryItem(db.prisma, {
      userId: owner.id,
      gameId: game.id,
      status: "PLAYING",
      withOpenPlay: false,
    });
    await createPlay(db.prisma, { libraryItemId: item.id });
    const note = await createNote(db.prisma, {
      userId: owner.id,
      gameId: game.id,
      content: SECRET,
      playedMinutes: 45,
    });
    await db.prisma.follow.create({
      data: { followerId: friend.id, followingId: owner.id },
    });
    return { owner, friend, note };
  }

  it("then public profile and activity reads never contain it", async () => {
    const { owner, friend } = await seed();

    const reads = await Promise.all([
      getPublicProfile(owner.username!, friend.id),
      getPublicProfile(owner.username!),
      getActivityForUser(owner.id, friend.id),
      getActivityForUser(owner.id, undefined),
      getActivityFeedForViewer(friend.id),
    ]);

    for (const read of reads) {
      expect(JSON.stringify(read)).not.toContain(SECRET);
    }
    expect(
      (await getActivityFeedForViewer(friend.id)).items.length
    ).toBeGreaterThan(0);
  });

  it("then another user cannot read it by id or in their timeline", async () => {
    const { friend, note } = await seed();

    await expect(
      getJournalEntryById(friend.id, note.id)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(await getJournalTimeline(friend.id)).toEqual([]);
  });
});
