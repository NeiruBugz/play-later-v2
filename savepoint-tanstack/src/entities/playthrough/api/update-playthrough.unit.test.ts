/**
 * Unit tests for updatePlaythrough entity query (Slice 4 / spec 016).
 *
 * Covers:
 * - Partial patch: only provided fields are written; unprovided fields are
 *   not included in the update payload.
 * - NotFoundError when the run does not exist.
 * - NotFoundError when the run's libraryItem.userId !== userId
 *   (anti-enumeration — same error for missing vs. not-owned).
 * - syncLibraryStatusFromRuns is invoked inside the same transaction on a
 *   status change.
 * - ConflictError when Prisma raises a unique-constraint violation on
 *   @@unique([libraryItemId, ordinal]).
 *
 * Prisma is mocked via the global setup in test/setup/unit-setup.ts.
 * $transaction is made to invoke the callback synchronously with a mock tx.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/shared/lib/db.server";
import { ConflictError, NotFoundError } from "@/shared/lib/errors";

import { updatePlaythrough } from "./update-playthrough.server";

const OWNER_ID = "unit-owner-update-001";
const OTHER_ID = "unit-other-update-002";
const ITEM_ID = 10;
const RUN_ID = "run-update-001";

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
  playtimeMinutes: 120,
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
      update: vi.fn(),
    },
    libraryItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe("updatePlaythrough", () => {
  const mockedTransaction = vi.mocked(prisma.$transaction);

  beforeEach(() => {
    mockedTransaction.mockReset();
  });

  describe("given a valid owned run with a partial patch (notes only)", () => {
    let tx: ReturnType<typeof makeMockTx>;

    beforeEach(() => {
      tx = makeMockTx();
      tx.playthrough.findUnique.mockResolvedValue(STUB_RUN as never);
      tx.playthrough.update.mockResolvedValue({
        ...STUB_RUN,
        notes: "Updated notes",
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

    it("calls playthrough.update with only the provided notes field", async () => {
      await updatePlaythrough(OWNER_ID, { id: RUN_ID, notes: "Updated notes" });

      expect(tx.playthrough.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ notes: "Updated notes" }),
        })
      );
    });

    it("does not include unprovided fields in the update payload", async () => {
      await updatePlaythrough(OWNER_ID, { id: RUN_ID, notes: "Updated notes" });

      const callArgs = tx.playthrough.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(callArgs.data).not.toHaveProperty("status");
      expect(callArgs.data).not.toHaveProperty("platform");
      expect(callArgs.data).not.toHaveProperty("playtimeMinutes");
    });
  });

  describe("given a valid owned run with a status change to FINISHED", () => {
    let tx: ReturnType<typeof makeMockTx>;

    beforeEach(() => {
      tx = makeMockTx();
      tx.playthrough.findUnique.mockResolvedValue(STUB_RUN as never);
      tx.playthrough.update.mockResolvedValue({
        ...STUB_RUN,
        status: "FINISHED",
      } as never);
      tx.libraryItem.findUnique.mockResolvedValue({
        ...STUB_ITEM,
        statusIsManual: false,
        playthroughs: [{ status: "FINISHED" }],
      } as never);
      tx.libraryItem.update.mockResolvedValue(STUB_ITEM as never);

      mockedTransaction.mockImplementation(((cb: (tx: unknown) => unknown) =>
        cb(tx)) as never);
    });

    it("calls syncLibraryStatusFromRuns (libraryItem.update) after the patch", async () => {
      await updatePlaythrough(OWNER_ID, { id: RUN_ID, status: "FINISHED" });

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
        updatePlaythrough(OWNER_ID, { id: "nonexistent-run", notes: "x" })
      ).rejects.toBeInstanceOf(NotFoundError);
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
      await expect(
        updatePlaythrough(OWNER_ID, { id: RUN_ID, notes: "x" })
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("does not call playthrough.update", async () => {
      const tx = makeMockTx();
      tx.playthrough.findUnique.mockResolvedValue({
        ...STUB_RUN,
        libraryItem: { ...STUB_ITEM, userId: OTHER_ID },
      } as never);
      mockedTransaction.mockImplementation(((cb: (tx: unknown) => unknown) =>
        cb(tx)) as never);

      await expect(
        updatePlaythrough(OWNER_ID, { id: RUN_ID, notes: "x" })
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(tx.playthrough.update).not.toHaveBeenCalled();
    });
  });

  describe("given Prisma raises a unique-constraint error on [libraryItemId, ordinal]", () => {
    beforeEach(() => {
      const tx = makeMockTx();
      tx.playthrough.findUnique.mockResolvedValue(STUB_RUN as never);

      const prismaUniqueError = Object.assign(new Error("Unique constraint"), {
        code: "P2002",
        meta: { target: ["libraryItemId", "ordinal"] },
      });
      tx.playthrough.update.mockRejectedValue(prismaUniqueError);
      tx.libraryItem.findUnique.mockResolvedValue({
        ...STUB_ITEM,
        statusIsManual: false,
        playthroughs: [{ status: "PLAYING" }],
      } as never);

      mockedTransaction.mockImplementation(((cb: (tx: unknown) => unknown) =>
        cb(tx)) as never);
    });

    it("maps the Prisma error to ConflictError", async () => {
      await expect(
        updatePlaythrough(OWNER_ID, { id: RUN_ID, ordinal: 1 })
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });
});
