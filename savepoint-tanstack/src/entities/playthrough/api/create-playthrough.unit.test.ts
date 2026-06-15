/**
 * Unit tests for createPlaythrough entity query.
 *
 * Covers:
 * - ordinal 1 + kind FIRST for the first run on an item
 * - ordinal max+1 + kind REPLAY coercion for subsequent runs
 *   (even when caller passes kind: "FIRST")
 * - NotFoundError when the library item is missing
 * - NotFoundError when the library item belongs to a different user
 *   (anti-enumeration — both look identical to the caller)
 *
 * Prisma is mocked via the global setup in test/setup/unit.ts.
 * $transaction is made to invoke the callback synchronously with a mock tx
 * that exposes the table delegates used by createPlaythrough +
 * syncLibraryStatusFromRuns.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/shared/lib/db.server";
import { ConflictError, NotFoundError } from "@/shared/lib/errors";

import { createPlaythrough } from "./create-playthrough.server";

const OWNER_ID = "unit-owner-001";
const OTHER_ID = "unit-other-002";
const ITEM_ID = 1;

const STUB_ITEM = {
  id: ITEM_ID,
  userId: OWNER_ID,
  gameId: "game-1",
  status: "SHELF" as const,
  statusIsManual: false,
  platform: null,
  rating: null,
  startedAt: null,
  completedAt: null,
  statusChangedAt: null,
  acquisitionType: "DIGITAL" as const,
  hasBeenPlayed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const STUB_PLAYTHROUGH = {
  id: "pt-1",
  libraryItemId: ITEM_ID,
  ordinal: 1,
  kind: "FIRST" as const,
  status: "PLAYING" as const,
  platform: null,
  startedAt: null,
  finishedAt: null,
  playtimeMinutes: 0,
  rating: null,
  completion: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeMockTx() {
  return {
    playthrough: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    libraryItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe("createPlaythrough", () => {
  const mockedFindUnique = vi.mocked(prisma.libraryItem.findUnique);
  const mockedTransaction = vi.mocked(prisma.$transaction);

  beforeEach(() => {
    mockedFindUnique.mockReset();
    mockedTransaction.mockReset();
  });

  describe("given the first run on an owned library item", () => {
    let tx: ReturnType<typeof makeMockTx>;

    beforeEach(() => {
      mockedFindUnique.mockResolvedValue(STUB_ITEM as never);

      tx = makeMockTx();
      tx.playthrough.findMany.mockResolvedValue([]);
      tx.playthrough.create.mockResolvedValue({
        ...STUB_PLAYTHROUGH,
        ordinal: 1,
        kind: "FIRST",
      } as never);
      tx.libraryItem.findUnique.mockResolvedValue({
        ...STUB_ITEM,
        statusIsManual: false,
        playthroughs: [{ status: "PLAYING" }],
      } as never);
      tx.libraryItem.update.mockResolvedValue(STUB_ITEM as never);

      mockedTransaction.mockImplementation(((cb: (tx: unknown) => unknown) =>
        cb(tx)) as never);
    });

    it("assigns ordinal 1 to the new run", async () => {
      await createPlaythrough(OWNER_ID, {
        libraryItemId: ITEM_ID,
        status: "PLAYING",
      });

      expect(tx.playthrough.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ordinal: 1 }),
        })
      );
    });

    it("coerces kind to FIRST regardless of caller input", async () => {
      await createPlaythrough(OWNER_ID, {
        libraryItemId: ITEM_ID,
        status: "PLAYING",
        kind: "REPLAY",
      });

      expect(tx.playthrough.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ kind: "FIRST" }),
        })
      );
    });

    it("calls syncLibraryStatusFromRuns inside the same transaction", async () => {
      await createPlaythrough(OWNER_ID, {
        libraryItemId: ITEM_ID,
        status: "PLAYING",
      });

      expect(tx.libraryItem.findUnique).toHaveBeenCalled();
      expect(tx.libraryItem.update).toHaveBeenCalled();
    });
  });

  describe("given a second run on an owned library item (existing run with ordinal 1)", () => {
    let tx: ReturnType<typeof makeMockTx>;

    beforeEach(() => {
      mockedFindUnique.mockResolvedValue(STUB_ITEM as never);

      tx = makeMockTx();
      tx.playthrough.findMany.mockResolvedValue([{ ordinal: 1 }]);
      tx.playthrough.create.mockResolvedValue({
        ...STUB_PLAYTHROUGH,
        id: "pt-2",
        ordinal: 2,
        kind: "REPLAY",
      } as never);
      tx.libraryItem.findUnique.mockResolvedValue({
        ...STUB_ITEM,
        statusIsManual: false,
        playthroughs: [{ status: "FINISHED" }, { status: "PLAYING" }],
      } as never);
      tx.libraryItem.update.mockResolvedValue(STUB_ITEM as never);

      mockedTransaction.mockImplementation(((cb: (tx: unknown) => unknown) =>
        cb(tx)) as never);
    });

    it("assigns ordinal max+1 (2) to the new run", async () => {
      await createPlaythrough(OWNER_ID, {
        libraryItemId: ITEM_ID,
        status: "PLAYING",
      });

      expect(tx.playthrough.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ordinal: 2 }),
        })
      );
    });

    it("coerces kind to REPLAY even when caller explicitly passes FIRST", async () => {
      await createPlaythrough(OWNER_ID, {
        libraryItemId: ITEM_ID,
        status: "PLAYING",
        kind: "FIRST",
      });

      expect(tx.playthrough.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ kind: "REPLAY" }),
        })
      );
    });
  });

  describe("given a library item that does not exist", () => {
    beforeEach(() => {
      mockedFindUnique.mockResolvedValue(null);
    });

    it("throws NotFoundError", async () => {
      await expect(
        createPlaythrough(OWNER_ID, {
          libraryItemId: 999,
          status: "PLAYING",
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("does not attempt a DB transaction", async () => {
      await expect(
        createPlaythrough(OWNER_ID, {
          libraryItemId: 999,
          status: "PLAYING",
        })
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(mockedTransaction).not.toHaveBeenCalled();
    });
  });

  describe("given Prisma raises a unique-constraint error on [libraryItemId, ordinal]", () => {
    beforeEach(() => {
      mockedFindUnique.mockResolvedValue(STUB_ITEM as never);

      const tx = makeMockTx();
      tx.playthrough.findMany.mockResolvedValue([{ ordinal: 1 }]);

      const prismaUniqueError = Object.assign(new Error("Unique constraint"), {
        code: "P2002",
        meta: { target: ["libraryItemId", "ordinal"] },
      });
      tx.playthrough.create.mockRejectedValue(prismaUniqueError);

      mockedTransaction.mockImplementation(((cb: (tx: unknown) => unknown) =>
        cb(tx)) as never);
    });

    it("maps the Prisma error to ConflictError", async () => {
      await expect(
        createPlaythrough(OWNER_ID, {
          libraryItemId: ITEM_ID,
          status: "PLAYING",
        })
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("given a library item owned by a different user", () => {
    beforeEach(() => {
      mockedFindUnique.mockResolvedValue({
        ...STUB_ITEM,
        userId: OTHER_ID,
      } as never);
    });

    it("throws NotFoundError (anti-enumeration — same error as missing)", async () => {
      await expect(
        createPlaythrough(OWNER_ID, {
          libraryItemId: ITEM_ID,
          status: "PLAYING",
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("does not attempt a DB transaction", async () => {
      await expect(
        createPlaythrough(OWNER_ID, {
          libraryItemId: ITEM_ID,
          status: "PLAYING",
        })
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(mockedTransaction).not.toHaveBeenCalled();
    });
  });
});
