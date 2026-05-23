/**
 * Unit tests for createJournalEntry — exercises the P2003 game-FK branch and
 * the fallback re-throw for other Prisma errors. Both require DB constraint
 * violations that are awkward to trigger reliably in integration tests.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";
import { createJournalEntry } from "./create-journal-entry.server";

const mockedCreate = vi.mocked(prisma.journalEntry.create);

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

describe("createJournalEntry — Prisma error mapping", () => {
  beforeEach(() => {
    mockedCreate.mockReset();
  });

  describe("given prisma.journalEntry.create throws P2003 with game in meta (invalid gameId FK)", () => {
    beforeEach(() => {
      mockedCreate.mockRejectedValue(
        makePrismaError("P2003", {
          field_name: "game_id",
          cause: "Foreign key constraint violated on the field: `gameId`",
        })
      );
    });

    it("re-throws as NotFoundError for the missing referenced game", async () => {
      await expect(
        createJournalEntry("user-abc", {
          content: "My entry",
          gameId: "nonexistent-game",
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given prisma.journalEntry.create throws a non-P2003 Prisma error", () => {
    beforeEach(() => {
      mockedCreate.mockRejectedValue(makePrismaError("P2002", {}));
    });

    it("re-throws the raw error without wrapping", async () => {
      await expect(
        createJournalEntry("user-abc", { content: "My entry" })
      ).rejects.toMatchObject({ code: "P2002" });
    });
  });
});
