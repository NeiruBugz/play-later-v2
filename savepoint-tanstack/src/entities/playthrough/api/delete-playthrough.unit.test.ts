/**
 * Unit tests for deletePlaythrough entity query (Slice 4 / spec 016).
 *
 * Covers:
 * - NotFoundError when the run does not exist.
 * - NotFoundError when the run's libraryItem.userId !== userId
 *   (anti-enumeration — same error for missing vs. not-owned).
 * - Happy path: playthrough.delete called with the correct id.
 * - syncLibraryStatusFromRuns invoked after the delete (status re-sync).
 *
 * Prisma is mocked via the global setup in test/setup/unit-setup.ts.
 * $transaction is made to invoke the callback synchronously with a mock tx.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import { deletePlaythrough } from "./delete-playthrough.server";

const OWNER_ID = "unit-owner-delete-001";
const OTHER_ID = "unit-other-delete-002";
const ITEM_ID = 20;
const RUN_ID = "run-delete-001";

const STUB_ITEM = {
  id: ITEM_ID,
  userId: OWNER_ID,
  status: "PLAYING" as const,
  statusIsManual: false,
  hasBeenPlayed: false,
};

const STUB_RUN = {
  id: RUN_ID,
  libraryItemId: ITEM_ID,
  ordinal: 1,
  kind: "FIRST" as const,
  status: "PLAYING" as const,
  platform: null,
  startedAt: null,
  finishedAt: null,
  playtimeMinutes: 60,
  rating: null,
  completion: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  libraryItem: STUB_ITEM,
};

function makeMockTx() {
  return {
    playthrough: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    libraryItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe("deletePlaythrough", () => {
  const mockedTransaction = vi.mocked(prisma.$transaction);

  beforeEach(() => {
    mockedTransaction.mockReset();
  });

  describe("given an owned run that exists", () => {
    let tx: ReturnType<typeof makeMockTx>;

    beforeEach(() => {
      tx = makeMockTx();
      tx.playthrough.findUnique.mockResolvedValue(STUB_RUN as never);
      tx.playthrough.delete.mockResolvedValue(STUB_RUN as never);
      tx.libraryItem.findUnique.mockResolvedValue({
        ...STUB_ITEM,
        statusIsManual: false,
        playthroughs: [],
      } as never);
      tx.libraryItem.update.mockResolvedValue(STUB_ITEM as never);

      mockedTransaction.mockImplementation(((cb: (tx: unknown) => unknown) =>
        cb(tx)) as never);
    });

    it("calls playthrough.delete with the correct run id", async () => {
      await deletePlaythrough(OWNER_ID, RUN_ID);

      expect(tx.playthrough.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: RUN_ID }),
        })
      );
    });

    it("calls syncLibraryStatusFromRuns (libraryItem.update) after the delete", async () => {
      await deletePlaythrough(OWNER_ID, RUN_ID);

      expect(tx.libraryItem.update).toHaveBeenCalled();
    });
  });

  describe("given a run that does not exist", () => {
    beforeEach(() => {
      const tx = makeMockTx();
      tx.playthrough.findUnique.mockResolvedValue(null);

      mockedTransaction.mockImplementation(((cb: (tx: unknown) => unknown) =>
        cb(tx)) as never);
    });

    it("throws NotFoundError", async () => {
      await expect(
        deletePlaythrough(OWNER_ID, "nonexistent-run")
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("does not attempt to delete anything", async () => {
      const tx = makeMockTx();
      tx.playthrough.findUnique.mockResolvedValue(null);
      mockedTransaction.mockImplementation(((cb: (tx: unknown) => unknown) =>
        cb(tx)) as never);

      await expect(
        deletePlaythrough(OWNER_ID, "nonexistent-run")
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(tx.playthrough.delete).not.toHaveBeenCalled();
    });
  });

  describe("given a run owned by a different user", () => {
    beforeEach(() => {
      const tx = makeMockTx();
      tx.playthrough.findUnique.mockResolvedValue({
        ...STUB_RUN,
        libraryItem: { ...STUB_ITEM, userId: OTHER_ID },
      } as never);

      mockedTransaction.mockImplementation(((cb: (tx: unknown) => unknown) =>
        cb(tx)) as never);
    });

    it("throws NotFoundError (anti-enumeration — same error as missing)", async () => {
      await expect(deletePlaythrough(OWNER_ID, RUN_ID)).rejects.toBeInstanceOf(
        NotFoundError
      );
    });

    it("does not attempt to delete anything", async () => {
      const tx = makeMockTx();
      tx.playthrough.findUnique.mockResolvedValue({
        ...STUB_RUN,
        libraryItem: { ...STUB_ITEM, userId: OTHER_ID },
      } as never);
      mockedTransaction.mockImplementation(((cb: (tx: unknown) => unknown) =>
        cb(tx)) as never);

      await expect(deletePlaythrough(OWNER_ID, RUN_ID)).rejects.toBeInstanceOf(
        NotFoundError
      );

      expect(tx.playthrough.delete).not.toHaveBeenCalled();
    });
  });
});
