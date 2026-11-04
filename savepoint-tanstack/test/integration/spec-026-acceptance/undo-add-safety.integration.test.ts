/**
 * @spec: 026-mindful-core-simplification
 * @regression
 *
 * Journey 4 - Undo on the add confirmation never destroys user data: it only
 * removes a game that was just added with nothing but an optional "why" note.
 */

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { addGameWorker } from "@/features/add-game/api/add-game.worker";
import { undoAddGameWorker } from "@/features/add-game/api/undo-add-game.worker";
import { logTimeWorker } from "@/features/compose-journal-entry/api/log-time-fn.worker";
import { answerPromptWorker } from "@/features/library-prompts/api/answer-prompt-fn.worker";
import { setStatusWorker } from "@/features/manage-library-entry/api/set-status-fn.worker";
import { addToUpNextWorker } from "@/features/up-next/api/add-to-up-next-fn.worker";
import { ConflictError } from "@/shared/lib/errors";
import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";

import { createGame, createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";
import { wipeAllTables } from "./support.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("spec-026-undo-add");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await wipeAllTables(db);
});

afterEach(() => {
  vi.useRealTimers();
});

async function freshAdd(userId: string) {
  const game = await createGame(db.prisma);
  const added = await addGameWorker(userId, { igdbId: game.igdbId });
  return { game, itemId: added.libraryItemId, created: added.created };
}

async function expectRefused(userId: string, itemId: number) {
  const failure = await undoAddGameWorker(userId, {
    libraryItemId: itemId,
  }).catch((error: unknown) => error);
  expect(failure).toBeInstanceOf(ConflictError);
  expect((failure as ConflictError).context?.code).toBe("UNDO_ADD_UNAVAILABLE");
  expect(getUserFacingErrorMessage(failure)).toBe(
    "This game can't be undone anymore. Remove it from your library instead."
  );
}

describe("given a game added moments ago with a why answer and a queue place (AC 2.6)", () => {
  it("undo removes the game, its why note and its queue place, renumbering the rest", async () => {
    const user = await createUser(db.prisma);
    const queuedBehind = await freshAdd(user.id);
    const target = await freshAdd(user.id);
    const other = await freshAdd(user.id);
    for (const { itemId } of [target, queuedBehind, other]) {
      await addToUpNextWorker(user.id, { id: itemId });
    }
    await answerPromptWorker(user.id, {
      id: target.itemId,
      kind: "WHY",
      text: "Looks fun",
    });

    await undoAddGameWorker(user.id, { libraryItemId: target.itemId });

    // 2.6: "no longer in their library, its queue place is freed, and any 'why' answer ... is gone"
    expect(
      await db.prisma.libraryItem.count({ where: { id: target.itemId } })
    ).toBe(0);
    expect(
      await db.prisma.journalEntry.count({ where: { gameId: target.game.id } })
    ).toBe(0);
    const queue = await db.prisma.libraryItem.findMany({
      where: { userId: user.id, upNextPosition: { not: null } },
      orderBy: { upNextPosition: "asc" },
      select: { id: true, upNextPosition: true },
    });
    expect(queue).toEqual([
      { id: queuedBehind.itemId, upNextPosition: 1 },
      { id: other.itemId, upNextPosition: 2 },
    ]);
  });
});

describe("given Undo is no longer safe (AC 2.6)", () => {
  it("refuses a game that was already in the library before this add", async () => {
    const user = await createUser(db.prisma);
    const { game, itemId } = await freshAdd(user.id);
    await db.prisma.libraryItem.update({
      where: { id: itemId },
      data: { createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const again = await addGameWorker(user.id, { igdbId: game.igdbId });

    expect(again).toMatchObject({ libraryItemId: itemId, created: false });
    await expectRefused(user.id, itemId);
    expect(await db.prisma.libraryItem.count({ where: { id: itemId } })).toBe(
      1
    );
  });

  it("refuses once time was logged, keeping the game and the note", async () => {
    const user = await createUser(db.prisma);
    const { game, itemId } = await freshAdd(user.id);
    await logTimeWorker(user.id, { gameId: game.id, playedMinutes: 45 });

    await expectRefused(user.id, itemId);

    expect(await db.prisma.libraryItem.count({ where: { id: itemId } })).toBe(
      1
    );
    expect(
      await db.prisma.journalEntry.count({
        where: { gameId: game.id, playedMinutes: 45 },
      })
    ).toBe(1);
  });

  it("refuses once the game was started (a play exists)", async () => {
    const user = await createUser(db.prisma);
    const { itemId } = await freshAdd(user.id);
    await setStatusWorker(user.id, { id: itemId, to: "PLAYING" });

    await expectRefused(user.id, itemId);
  });

  it("refuses after 60 seconds, even with only a why note", async () => {
    const user = await createUser(db.prisma);
    const { game, itemId } = await freshAdd(user.id);
    await answerPromptWorker(user.id, {
      id: itemId,
      kind: "WHY",
      text: "Still just a why",
    });

    vi.useFakeTimers({ toFake: ["Date"], now: Date.now() + 61_000 });
    await expectRefused(user.id, itemId);
    vi.useRealTimers();

    expect(await db.prisma.libraryItem.count({ where: { id: itemId } })).toBe(
      1
    );
    expect(
      await db.prisma.journalEntry.count({ where: { gameId: game.id } })
    ).toBe(1);
  });
});
