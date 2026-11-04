import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  getActivityFeedForViewer,
  getActivityForUser,
} from "@/entities/activity-feed/api/get-activity-feed.server";
import { setLibraryItemStatus } from "@/entities/library-item/api/set-library-item-status.server";
import { setOwnership } from "@/entities/library-item/api/set-ownership.server";
import { getProfilePlaythroughs } from "@/entities/playthrough/api/get-profile-playthroughs.server";
import { getPublicProfile } from "@/entities/profile/api/get-public-profile.server";
import { NotFoundError } from "@/shared/lib/errors";

import {
  createGame,
  createLibraryItem,
  createPlay,
  createUser,
} from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("set-ownership");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.follow.deleteMany();
  await db.prisma.playthrough.deleteMany();
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

async function seedItem(
  userId: string,
  overrides: {
    status?: "WANT" | "PLAYING" | "DONE";
    upNextPosition?: number | null;
    isOwned?: boolean;
  } = {}
) {
  const game = await createGame(db.prisma);
  return createLibraryItem(db.prisma, {
    userId,
    gameId: game.id,
    withOpenPlay: false,
    ...overrides,
  });
}

describe("setOwnership", () => {
  it("flips the flag and leaves status, queue place and plays untouched", async () => {
    const user = await createUser(db.prisma);
    const item = await seedItem(user.id, {
      status: "WANT",
      upNextPosition: 1,
    });
    await createPlay(db.prisma, { libraryItemId: item.id });

    const { item: updated } = await setOwnership(user.id, item.id, false);

    expect(updated.isOwned).toBe(false);
    expect(updated.status).toBe("WANT");
    expect(updated.upNextPosition).toBe(1);
    expect(updated.statusChangedAt).toEqual(item.statusChangedAt);
    expect(
      await db.prisma.playthrough.count({ where: { libraryItemId: item.id } })
    ).toBe(1);

    const { item: back } = await setOwnership(user.id, item.id, true);
    expect(back.isOwned).toBe(true);
  });

  it("throws NotFoundError for a missing item", async () => {
    const user = await createUser(db.prisma);

    await expect(setOwnership(user.id, 987_654, false)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("throws NotFoundError for another user's item and leaves it alone", async () => {
    const owner = await createUser(db.prisma);
    const stranger = await createUser(db.prisma);
    const item = await seedItem(owner.id);

    await expect(
      setOwnership(stranger.id, item.id, false)
    ).rejects.toBeInstanceOf(NotFoundError);

    const row = await db.prisma.libraryItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(row.isOwned).toBe(true);
  });

  it("survives WANT to PLAYING and back to WANT", async () => {
    const user = await createUser(db.prisma);
    const item = await seedItem(user.id, { isOwned: false });

    await setLibraryItemStatus(user.id, item.id, "PLAYING");
    const { item: back } = await setLibraryItemStatus(user.id, item.id, "WANT");

    expect(back.status).toBe("WANT");
    expect(back.isOwned).toBe(false);
  });
});

describe("friends' reads never expose ownership", () => {
  async function seedPublicOwnerWithNotOwnedItem() {
    const owner = await createUser(db.prisma, {
      isPublicProfile: true,
      username: "ownerless",
      usernameNormalized: "ownerless",
    });
    const viewer = await createUser(db.prisma, { isPublicProfile: true });
    const item = await seedItem(owner.id, {
      status: "PLAYING",
      isOwned: false,
    });
    await createPlay(db.prisma, { libraryItemId: item.id });
    await db.prisma.follow.create({
      data: { followerId: viewer.id, followingId: owner.id },
    });
    return { owner, viewer };
  }

  it("activity for a user carries no isOwned key", async () => {
    const { owner, viewer } = await seedPublicOwnerWithNotOwnedItem();

    const { items } = await getActivityForUser(owner.id, viewer.id);

    expect(items).toHaveLength(1);
    expect(items[0]).not.toHaveProperty("isOwned");
  });

  it("the follow feed carries no isOwned key", async () => {
    const { viewer } = await seedPublicOwnerWithNotOwnedItem();

    const { items } = await getActivityFeedForViewer(viewer.id);

    expect(items).toHaveLength(1);
    expect(items[0]).not.toHaveProperty("isOwned");
  });

  it("profile playthroughs carry no isOwned key", async () => {
    const { owner, viewer } = await seedPublicOwnerWithNotOwnedItem();

    const runs = await getProfilePlaythroughs(owner.id, true, viewer.id);

    expect(runs).toHaveLength(1);
    expect(JSON.stringify(runs)).not.toContain("isOwned");
  });

  it("the public profile carries no isOwned key", async () => {
    const { viewer } = await seedPublicOwnerWithNotOwnedItem();

    const profile = await getPublicProfile("ownerless", viewer.id);

    expect(JSON.stringify(profile)).not.toContain("isOwned");
  });
});
