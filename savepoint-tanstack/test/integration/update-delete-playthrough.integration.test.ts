/**
 * Integration tests for updatePlaythrough + deletePlaythrough entity queries
 * (Slice 4 / spec 016).
 *
 * Imports entity functions directly — not createServerFn wrappers.
 * See FOOT-GUNS.md foot-gun #8.
 *
 * Covers:
 * - update: PLAYING run → FINISHED; the library item status is untouched.
 * - delete + detach: run with 2 journal entries deleted; entries survive
 *   with playthroughId === null; the library item status is untouched.
 * - ownership: updatePlaythrough / deletePlaythrough with a different
 *   user's run → NotFoundError.
 * - Rating guard: updatePlaythrough rejects out-of-range ratings (0, 11,
 *   negative) with ValidationError; accepts boundary values 1 and 10.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { deletePlaythrough } from "@/entities/playthrough/api/delete-playthrough.server";
import { updatePlaythrough } from "@/entities/playthrough/api/update-playthrough.server";
import { NotFoundError, ValidationError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("update-delete-playthrough");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const USER_ID = "upd-del-pt-user-001";
const OTHER_USER_ID = "upd-del-pt-other-002";

async function seedBaseData() {
  await db.prisma.playthrough.deleteMany();
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.createMany({
    data: [
      {
        id: USER_ID,
        email: "upd-del-pt@example.com",
        name: "Update Delete PT User",
        emailVerified: true,
        username: "upddelptuser",
        usernameNormalized: "upddelptuser",
        isPublicProfile: false,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        id: OTHER_USER_ID,
        email: "upd-del-pt-other@example.com",
        name: "Other User",
        emailVerified: true,
        username: "upddelptother",
        usernameNormalized: "upddelptother",
        isPublicProfile: false,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ],
  });

  await db.prisma.game.create({
    data: {
      id: "game-upd-del-pt-001",
      igdbId: 88001,
      title: "Test Game",
      slug: "test-game-upd-del-pt",
      coverImage: null,
      releaseDate: null,
    },
  });
}

describe("updatePlaythrough", () => {
  describe("given a PLAYING run on an owned item, updated to FINISHED", () => {
    let libraryItemId: number;
    let runId: string;

    beforeEach(async () => {
      await seedBaseData();

      const item = await db.prisma.libraryItem.create({
        data: {
          userId: USER_ID,
          gameId: "game-upd-del-pt-001",
          status: "PLAYING",
          acquisitionType: "DIGITAL",
        },
      });
      libraryItemId = item.id;

      const run = await db.prisma.playthrough.create({
        data: {
          libraryItemId,
          ordinal: 1,
          kind: "FIRST",
          status: "PLAYING",
          playtimeMinutes: 60,
        },
      });
      runId = run.id;
    });

    it("updates the run status to FINISHED", async () => {
      await updatePlaythrough(USER_ID, { id: runId, status: "FINISHED" });

      const run = await db.prisma.playthrough.findUniqueOrThrow({
        where: { id: runId },
      });
      expect(run.status).toBe("FINISHED");
    });

    it("leaves the library item status alone (only setLibraryItemStatus changes it)", async () => {
      await updatePlaythrough(USER_ID, { id: runId, status: "FINISHED" });

      const item = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: libraryItemId },
      });
      expect(item.status).toBe("PLAYING");
    });

    it("only updates the provided fields — playtimeMinutes stays unchanged", async () => {
      await updatePlaythrough(USER_ID, { id: runId, status: "FINISHED" });

      const run = await db.prisma.playthrough.findUniqueOrThrow({
        where: { id: runId },
      });
      expect(run.playtimeMinutes).toBe(60);
    });
  });

  describe("given a run owned by a different user", () => {
    let otherItemId: number;
    let otherRunId: string;

    beforeEach(async () => {
      await seedBaseData();

      const item = await db.prisma.libraryItem.create({
        data: {
          userId: OTHER_USER_ID,
          gameId: "game-upd-del-pt-001",
          status: "PLAYING",
          acquisitionType: "DIGITAL",
        },
      });
      otherItemId = item.id;

      const run = await db.prisma.playthrough.create({
        data: {
          libraryItemId: otherItemId,
          ordinal: 1,
          kind: "FIRST",
          status: "PLAYING",
          playtimeMinutes: 30,
        },
      });
      otherRunId = run.id;
    });

    it("throws NotFoundError when the caller is not the owner", async () => {
      await expect(
        updatePlaythrough(USER_ID, { id: otherRunId, status: "FINISHED" })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});

describe("deletePlaythrough", () => {
  describe("given a run with 2 journal entries on a queued WANT item", () => {
    let libraryItemId: number;
    let runId: string;
    let entryIds: string[];

    beforeEach(async () => {
      await seedBaseData();

      const item = await db.prisma.libraryItem.create({
        data: {
          userId: USER_ID,
          gameId: "game-upd-del-pt-001",
          status: "WANT",
          upNextPosition: 1,
          acquisitionType: "DIGITAL",
        },
      });
      libraryItemId = item.id;

      const run = await db.prisma.playthrough.create({
        data: {
          libraryItemId,
          ordinal: 1,
          kind: "FIRST",
          status: "PLAYING",
          playtimeMinutes: 90,
        },
      });
      runId = run.id;

      // Create 2 journal entries linked to this run
      const entries = await Promise.all([
        db.prisma.journalEntry.create({
          data: {
            userId: USER_ID,
            content: "Session one",
            gameId: "game-upd-del-pt-001",
            libraryItemId,
            playthroughId: runId,
          },
        }),
        db.prisma.journalEntry.create({
          data: {
            userId: USER_ID,
            content: "Session two",
            gameId: "game-upd-del-pt-001",
            libraryItemId,
            playthroughId: runId,
          },
        }),
      ]);
      entryIds = entries.map((e) => e.id);
    });

    it("removes the Playthrough row", async () => {
      await deletePlaythrough(USER_ID, runId);

      const run = await db.prisma.playthrough.findUnique({
        where: { id: runId },
      });
      expect(run).toBeNull();
    });

    it("keeps both journal entries (SetNull — entries survive)", async () => {
      await deletePlaythrough(USER_ID, runId);

      const entries = await db.prisma.journalEntry.findMany({
        where: { id: { in: entryIds } },
      });
      expect(entries).toHaveLength(2);
    });

    it("detaches both journal entries from the run (playthroughId becomes null)", async () => {
      await deletePlaythrough(USER_ID, runId);

      const entries = await db.prisma.journalEntry.findMany({
        where: { id: { in: entryIds } },
      });
      for (const entry of entries) {
        expect(entry.playthroughId).toBeNull();
      }
    });

    it("leaves the item's status and queue position untouched", async () => {
      await deletePlaythrough(USER_ID, runId);

      const item = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: libraryItemId },
      });
      expect(item.status).toBe("WANT");
      expect(item.upNextPosition).toBe(1);
    });
  });

  describe("given a run owned by a different user", () => {
    let otherRunId: string;

    beforeEach(async () => {
      await seedBaseData();

      const item = await db.prisma.libraryItem.create({
        data: {
          userId: OTHER_USER_ID,
          gameId: "game-upd-del-pt-001",
          status: "PLAYING",
          acquisitionType: "DIGITAL",
        },
      });

      const run = await db.prisma.playthrough.create({
        data: {
          libraryItemId: item.id,
          ordinal: 1,
          kind: "FIRST",
          status: "PLAYING",
          playtimeMinutes: 30,
        },
      });
      otherRunId = run.id;
    });

    it("throws NotFoundError when the caller is not the owner", async () => {
      await expect(
        deletePlaythrough(USER_ID, otherRunId)
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given deleting the only run of a DONE item", () => {
    let libraryItemId: number;
    let runId: string;

    beforeEach(async () => {
      await seedBaseData();

      const item = await db.prisma.libraryItem.create({
        data: {
          userId: USER_ID,
          gameId: "game-upd-del-pt-001",
          status: "DONE",
          acquisitionType: "DIGITAL",
        },
      });
      libraryItemId = item.id;

      const run = await db.prisma.playthrough.create({
        data: {
          libraryItemId,
          ordinal: 1,
          kind: "FIRST",
          status: "FINISHED",
          playtimeMinutes: 120,
        },
      });
      runId = run.id;
    });

    it("keeps the item DONE", async () => {
      await deletePlaythrough(USER_ID, runId);

      const item = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: libraryItemId },
      });
      expect(item.status).toBe("DONE");
    });
  });
});

describe("updatePlaythrough — rating range guard", () => {
  let runId: string;

  beforeEach(async () => {
    await seedBaseData();

    const item = await db.prisma.libraryItem.create({
      data: {
        userId: USER_ID,
        gameId: "game-upd-del-pt-001",
        status: "PLAYING",
        acquisitionType: "DIGITAL",
      },
    });

    const run = await db.prisma.playthrough.create({
      data: {
        libraryItemId: item.id,
        ordinal: 1,
        kind: "FIRST",
        status: "PLAYING",
        playtimeMinutes: 0,
      },
    });
    runId = run.id;
  });

  it.each([0, -1, 11])(
    "rejects out-of-range rating %i with ValidationError",
    async (rating) => {
      await expect(
        updatePlaythrough(USER_ID, { id: runId, rating })
      ).rejects.toBeInstanceOf(ValidationError);
    }
  );

  it.each([1, 10])(
    "accepts boundary rating %i without error",
    async (rating) => {
      await expect(
        updatePlaythrough(USER_ID, { id: runId, rating })
      ).resolves.toMatchObject({ rating });
    }
  );
});
