// @vitest-environment node
/**
 * @spec: 026-mindful-core-simplification
 * @regression
 *
 * Journey 6 (AC 2.14 Failed changes): errors thrown by the real workers and
 * entity queries cross the real server-fn serialization, keep their code, and
 * map to plain-language copy - never raw Zod or Prisma text.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createJournalEntry } from "@/entities/journal-entry/api/create-journal-entry.server";
import { undoAddGameWorker } from "@/features/add-game/api/undo-add-game.worker";
import { setStatusWorker } from "@/features/manage-library-entry/api/set-status-fn.worker";
import { addToUpNextWorker } from "@/features/up-next/api/add-to-up-next-fn.worker";
import { prisma } from "@/shared/lib/db.server";

import { sendErrorThroughServerFn } from "../../../test/support/server-fn-error-transport";
import { AppError } from "./errors";
import {
  getUserFacingErrorMessage,
  SAVE_FAILED_MESSAGE,
} from "./user-facing-error";

type TxStub = {
  $executeRaw: ReturnType<typeof vi.fn>;
  libraryItem: Record<string, ReturnType<typeof vi.fn>>;
  journalEntry: Record<string, ReturnType<typeof vi.fn>>;
};

let tx: TxStub;

beforeEach(() => {
  tx = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    libraryItem: {
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    journalEntry: { findMany: vi.fn() },
  };
  vi.mocked(prisma.$transaction).mockImplementation(((
    run: (client: TxStub) => Promise<unknown>
  ) => run(tx)) as never);
});

async function failureOf(attempt: () => Promise<unknown>): Promise<Error> {
  return (await attempt().then(
    () => {
      throw new Error("expected the change to fail");
    },
    (caught: unknown) => caught
  )) as Error;
}

async function receivedByClient(attempt: () => Promise<unknown>) {
  return sendErrorThroughServerFn(await failureOf(attempt));
}

describe("given Up Next already holds 5 games", () => {
  it("then the client receives CONFLICT / UP_NEXT_FULL and shows the queue-full copy", async () => {
    tx.libraryItem.findFirst!.mockResolvedValue({
      status: "WANT",
      upNextPosition: null,
    });
    tx.libraryItem.count!.mockResolvedValue(5);

    const received = await receivedByClient(() =>
      addToUpNextWorker("user-1", { id: 7 })
    );

    // 2.4 / 2.14: the code survives the wire and maps to plain copy
    expect(received).toBeInstanceOf(AppError);
    expect((received as AppError).code).toBe("CONFLICT");
    expect((received as AppError).context).toEqual({ code: "UP_NEXT_FULL" });
    expect(getUserFacingErrorMessage(received)).toBe(
      "Up Next holds 5 games. Remove one to add this."
    );
  });
});

describe("given the game is no longer in the library", () => {
  it("then the client receives NOT_FOUND with no server context and plain copy", async () => {
    tx.libraryItem.findFirst!.mockResolvedValue(null);

    const received = await receivedByClient(() =>
      setStatusWorker("user-1", { id: 7, to: "PLAYING" })
    );

    expect((received as AppError).code).toBe("NOT_FOUND");
    expect((received as AppError).context).toBeUndefined();
    expect(getUserFacingErrorMessage(received)).toBe(
      "That game isn't in your library anymore."
    );
  });
});

describe("given time is logged without a game", () => {
  it("then the client receives VALIDATION / TIME_NEEDS_GAME with the choose-a-game copy", async () => {
    const received = await receivedByClient(() =>
      createJournalEntry("user-1", { playedMinutes: 90 })
    );

    // 2.9: "Choose a game to log time."
    expect((received as AppError).code).toBe("VALIDATION");
    expect(getUserFacingErrorMessage(received)).toBe(
      "Choose a game to log time."
    );
  });
});

describe("given an add that is too old to undo", () => {
  it("then the client receives CONFLICT / UNDO_ADD_UNAVAILABLE with the remove-instead copy", async () => {
    tx.libraryItem.findFirst!.mockResolvedValue({
      createdAt: new Date(Date.now() - 10 * 60_000),
      gameId: "game-1",
      upNextPosition: null,
      _count: { playthroughs: 0 },
    });
    tx.journalEntry.findMany!.mockResolvedValue([]);

    const received = await receivedByClient(() =>
      undoAddGameWorker("user-1", { libraryItemId: 7 })
    );

    expect((received as AppError).code).toBe("CONFLICT");
    expect(getUserFacingErrorMessage(received)).toBe(
      "This game can't be undone anymore. Remove it from your library instead."
    );
  });
});

describe("given a technical failure with raw internals", () => {
  it("then a Zod validation failure shows only the generic save copy", async () => {
    const received = await receivedByClient(() =>
      setStatusWorker("user-1", { id: "not-a-number", to: "ARCHIVED" })
    );

    // 2.14: "never raw technical error text"
    expect((received as Error).message).toContain("invalid");
    expect(getUserFacingErrorMessage(received)).toBe(SAVE_FAILED_MESSAGE);
  });

  it("then a raw Prisma driver failure shows only the generic save copy", async () => {
    tx.libraryItem.findFirst!.mockRejectedValue(
      new Error(
        "Invalid `prisma.libraryItem.findFirst()` invocation: Unique constraint failed on the fields: (`userId`,`gameId`)"
      )
    );

    const received = await receivedByClient(() =>
      setStatusWorker("user-1", { id: 7, to: "PLAYING" })
    );

    expect((received as Error).message).toContain("prisma.libraryItem");
    const copy = getUserFacingErrorMessage(received);
    expect(copy).toBe(SAVE_FAILED_MESSAGE);
    expect(copy).not.toMatch(/prisma|constraint|invocation|zod|invalid/i);
  });
});
