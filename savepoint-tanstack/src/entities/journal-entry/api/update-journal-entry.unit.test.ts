/**
 * Unit tests for updateJournalEntry — exercises the Prisma P2025 TOCTOU catch
 * and the P2003 game-FK branch, both of which require race conditions or
 * specific DB constraint violations that are awkward to reproduce in integration
 * tests. We cover them here via the mocked Prisma client.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";
import { updateJournalEntry } from "./update-journal-entry.server";

const mockedFindUnique = vi.mocked(prisma.journalEntry.findUnique);
const mockedUpdate = vi.mocked(prisma.journalEntry.update);

const OWNER_ID = "unit-owner";
const ENTRY_ID = "entry-unit-99";

const STUB_ENTRY = {
  id: ENTRY_ID,
  userId: OWNER_ID,
  libraryItemId: 1,
  content: "Test journal content",
  rating: null,
  hoursPlayed: null,
  platform: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makePrismaError(
  code: string,
  meta: Record<string, unknown> = {}
): Prisma.PrismaClientKnownRequestError {
  const err = Object.create(
    Prisma.PrismaClientKnownRequestError.prototype
  ) as Prisma.PrismaClientKnownRequestError;
  Object.defineProperties(err, {
    code: { value: code, writable: false, enumerable: true },
    meta: { value: meta, writable: false, enumerable: true },
    message: {
      value: `Prisma ${code}`,
      writable: false,
      enumerable: true,
    },
    clientVersion: { value: "0.0.0", writable: false, enumerable: true },
  });
  return err;
}

describe("updateJournalEntry — Prisma error mapping", () => {
  beforeEach(() => {
    mockedFindUnique.mockReset();
    mockedUpdate.mockReset();
    mockedFindUnique.mockResolvedValue(STUB_ENTRY as never);
  });

  describe("given prisma.journalEntry.update throws P2025 (TOCTOU race)", () => {
    beforeEach(() => {
      mockedUpdate.mockRejectedValue(makePrismaError("P2025", {}));
    });

    it("re-throws as NotFoundError", async () => {
      await expect(
        updateJournalEntry(OWNER_ID, ENTRY_ID, { content: "new content" })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given prisma.journalEntry.update throws P2003 with game in meta (invalid gameId)", () => {
    beforeEach(() => {
      mockedUpdate.mockRejectedValue(
        makePrismaError("P2003", {
          field_name: "game_id",
          cause: "Foreign key constraint violated on the field: `gameId`",
        })
      );
    });

    it("re-throws as NotFoundError for the missing game", async () => {
      await expect(
        updateJournalEntry(OWNER_ID, ENTRY_ID, { gameId: "nonexistent-game" })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given prisma.journalEntry.update throws a non-P2025 non-P2003 Prisma error", () => {
    beforeEach(() => {
      mockedUpdate.mockRejectedValue(makePrismaError("P2002", {}));
    });

    it("re-throws the raw Prisma error without wrapping", async () => {
      await expect(
        updateJournalEntry(OWNER_ID, ENTRY_ID, { content: "new content" })
      ).rejects.toMatchObject({ code: "P2002" });
    });
  });
});
