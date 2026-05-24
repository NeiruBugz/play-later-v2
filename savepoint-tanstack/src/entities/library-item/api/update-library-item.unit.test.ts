/**
 * Unit tests for updateLibraryItem — exercises the Prisma P2025 TOCTOU catch
 * and the "throw error" re-throw for other Prisma errors. These branches
 * require concurrent transactions in integration tests, so we cover them here
 * via mocked Prisma.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";
import { updateLibraryItem } from "./update-library-item.server";

const mockedFindUnique = vi.mocked(prisma.libraryItem.findUnique);
const mockedUpdate = vi.mocked(prisma.libraryItem.update);

const OWNER_ID = "unit-owner";
const ITEM_ID = 99;

const STUB_ITEM = {
  id: ITEM_ID,
  userId: OWNER_ID,
  gameId: "game-1",
  status: "PLAYING" as const,
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

describe("updateLibraryItem — Prisma error mapping", () => {
  beforeEach(() => {
    mockedFindUnique.mockReset();
    mockedUpdate.mockReset();
    mockedFindUnique.mockResolvedValue(STUB_ITEM as never);
  });

  describe("given prisma.libraryItem.update throws P2025 (TOCTOU race)", () => {
    beforeEach(() => {
      mockedUpdate.mockRejectedValue(makePrismaError("P2025", {}));
    });

    it("re-throws as NotFoundError", async () => {
      await expect(
        updateLibraryItem(OWNER_ID, ITEM_ID, { status: "PLAYED" })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given prisma.libraryItem.update throws a non-P2025 Prisma error", () => {
    beforeEach(() => {
      mockedUpdate.mockRejectedValue(makePrismaError("P2003", {}));
    });

    it("re-throws the raw Prisma error without wrapping", async () => {
      await expect(
        updateLibraryItem(OWNER_ID, ITEM_ID, { status: "PLAYED" })
      ).rejects.toMatchObject({ code: "P2003" });
    });
  });
});
