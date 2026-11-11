import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { setStatusWorker } from "@/features/manage-library-entry/api/set-status-fn.worker";
import { undoStatusWorker } from "@/features/manage-library-entry/api/undo-status-fn.worker";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";

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
  db = await setupIsolatedDatabase("set-status-fn");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.playthrough.deleteMany();
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

async function seedWantItem(userId: string) {
  const game = await createGame(db.prisma);
  return createLibraryItem(db.prisma, {
    userId,
    gameId: game.id,
    status: "WANT",
    withOpenPlay: false,
  });
}

describe(setStatusWorker, () => {
  describe("given no userId", () => {
    it("throws UnauthorizedError", async () => {
      await expect(
        setStatusWorker(undefined, { id: 1, to: "PLAYING" })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("given a status outside WANT | PLAYING | DONE", () => {
    it("rejects before touching the entity", async () => {
      const user = await createUser(db.prisma);
      const item = await seedWantItem(user.id);

      await expect(
        setStatusWorker(user.id, { id: item.id, to: "SHELF" })
      ).rejects.toBeInstanceOf(ZodError);

      const after = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: item.id },
      });
      expect(after.status).toBe("WANT");
    });
  });

  describe("given another user's item", () => {
    it("throws NotFoundError and leaves the item untouched", async () => {
      const owner = await createUser(db.prisma);
      const intruder = await createUser(db.prisma);
      const item = await seedWantItem(owner.id);

      await expect(
        setStatusWorker(intruder.id, { id: item.id, to: "PLAYING" })
      ).rejects.toBeInstanceOf(NotFoundError);

      const after = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: item.id },
      });
      expect(after.status).toBe("WANT");
    });
  });

  describe("given an owned WANT item moved to PLAYING", () => {
    it("returns the new status, the queue position and the undo payload", async () => {
      const user = await createUser(db.prisma);
      const item = await seedWantItem(user.id);

      const result = await setStatusWorker(user.id, {
        id: item.id,
        to: "PLAYING",
      });

      expect(result.status).toBe("PLAYING");
      expect(result.upNextPosition).toBeNull();
      expect(result.undo.snapshot.status).toBe("WANT");
      expect(result.undo.createdPlayId).not.toBeNull();
      expect(result.undo.closedPlayId).toBeNull();
    });
  });

  describe("given a PLAYING item moved to DONE with a doneOutcome", () => {
    it("writes the status and the reason together", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma);
      const item = await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
        status: "PLAYING",
      });

      const result = await setStatusWorker(user.id, {
        id: item.id,
        to: "DONE",
        doneOutcome: "LET_GO",
      });

      const after = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: item.id },
      });
      expect(result.status).toBe("DONE");
      expect(after.status).toBe("DONE");
      expect(after.doneOutcome).toBe("LET_GO");
    });
  });

  describe("given a doneOutcome with a status other than DONE", () => {
    it.each(["WANT", "PLAYING"])(
      "rejects a move to %s and leaves the item untouched",
      async (to) => {
        const user = await createUser(db.prisma);
        const game = await createGame(db.prisma);
        const item = await createLibraryItem(db.prisma, {
          userId: user.id,
          gameId: game.id,
          status: to === "WANT" ? "PLAYING" : "WANT",
        });

        await expect(
          setStatusWorker(user.id, {
            id: item.id,
            to,
            doneOutcome: "FINISHED",
          })
        ).rejects.toBeInstanceOf(ZodError);

        const after = await db.prisma.libraryItem.findUniqueOrThrow({
          where: { id: item.id },
        });
        expect(after.status).toBe(item.status);
        expect(after.doneOutcome).toBeNull();
      }
    );
  });

  describe("given an item that carried a reason and is moved to DONE with another", () => {
    it("restores the previous reason when the change is undone", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma);
      const item = await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
        status: "PLAYING",
        doneOutcome: "FINISHED",
      });
      const changed = await setStatusWorker(user.id, {
        id: item.id,
        to: "DONE",
        doneOutcome: "LET_GO",
      });

      await undoStatusWorker(user.id, { id: item.id, undo: changed.undo });

      const after = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: item.id },
      });
      expect(after.status).toBe("PLAYING");
      expect(after.doneOutcome).toBe("FINISHED");
    });
  });
});
