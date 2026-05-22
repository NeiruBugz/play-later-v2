/**
 * Unit tests for deleteJournalEntry — exercises the Prisma P2025 TOCTOU catch
 * and the "throw error" re-throw for other Prisma errors. These branches
 * require concurrent transactions in integration tests, so we cover them here
 * via mocked Prisma.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";
import { deleteJournalEntry } from "./delete-journal-entry.server";

const mockedFindUnique = vi.mocked(prisma.journalEntry.findUnique);
const mockedDelete = vi.mocked(prisma.journalEntry.delete);

const OWNER_ID = "unit-owner";
const ENTRY_ID = "entry-unit-42";

const STUB_ENTRY = {
  id: ENTRY_ID,
  userId: OWNER_ID,
  libraryItemId: 1,
  content: "Test entry",
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

describe("deleteJournalEntry — Prisma error mapping", () => {
  beforeEach(() => {
    mockedFindUnique.mockReset();
    mockedDelete.mockReset();
    // Stub findUnique to return a matching entry by default.
    mockedFindUnique.mockResolvedValue(STUB_ENTRY as never);
  });

  describe("given prisma.journalEntry.delete throws P2025 (TOCTOU race)", () => {
    beforeEach(() => {
      mockedDelete.mockRejectedValue(makePrismaError("P2025", {}));
    });

    it("re-throws as NotFoundError", async () => {
      await expect(
        deleteJournalEntry(OWNER_ID, ENTRY_ID)
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given prisma.journalEntry.delete throws a non-P2025 Prisma error", () => {
    beforeEach(() => {
      mockedDelete.mockRejectedValue(makePrismaError("P2003", {}));
    });

    it("re-throws the raw Prisma error without wrapping", async () => {
      await expect(
        deleteJournalEntry(OWNER_ID, ENTRY_ID)
      ).rejects.toMatchObject({ code: "P2003" });
    });
  });
});
